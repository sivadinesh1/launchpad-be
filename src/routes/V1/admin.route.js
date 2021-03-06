const express = require('express');
const adminRoute = express.Router();

var pool = require('../../config/db');

const { handleError, ErrorHandler } = require('../../config/error');

const { getCenterDetails } = require('../../services/center.service');

const {
	insertUser,
	updateUserStatus,
	insertUserRole,
	getUsers,
	getOutstandingBalance,
	isUserExist,
	insertBank,
	updateCenterBankInfo,
	updateBank,
	updateBankDefaults,
} = require('../../services/admin.service');

const {
	getCustomerDiscount,
	updateCustomerDiscount,
	insertCustomer,
	updateCustomer,
	getCustomerDetails,
	getAllCustomerDefaultDiscounts,
	updateDefaultCustomerDiscount,
	getDiscountsByCustomerByBrand,
	getDiscountsByCustomer,
	insertDiscountsByBrands,
	updateCustomerShippingAddress,
	insertCustomerShippingAddress,
	getCustomerShippingAddress,
	inactivateCSA,
} = require('../../services/customers.service');

const { insertProduct, updateProduct } = require('../../services/products.service');
const { insertVendor, updateVendor } = require('../../services/vendors.service');
const { insertBrand, updateBrand } = require('../../services/brands.service');
const { getPermissions, checkUsernameExists } = require('../../services/auth.service');

const { isStockIdExist, insertToStock, insertItemHistoryTable } = require('../../services/stock.service');

adminRoute.get('/view-products-count/:centerid', (req, res) => {
	let center_id = req.params.centerid;

	let sql = `select count(*) as count from product p where 
	p.center_id = '${center_id}' `;

	pool.query(sql, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', `view-products-count/:centerid ${center_id}`, err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

adminRoute.get('/view-product-info/:centerid/:productid', (req, res) => {
	let center_id = req.params.centerid;
	let product_id = req.params.productid;

	let sql = `
	select p.*, b.name as brand_name, b.id as brand_id  
	from 
	product p,
	brand b 
	where
	p.brand_id = b.id and
	p.id = '${product_id}' and
	p.center_id = '${center_id}' `;

	pool.query(sql, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', `/view-product-info/:centerid/:productid ${center_id}, ${product_id}`, err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

// Add Product, product master
adminRoute.post('/add-product', async (req, res, next) => {
	let jsonObj = req.body;

	let returnResponse = await insertProduct(jsonObj, res);

	if (returnResponse.affectedRows === 1) {
		return res.status(200).json({
			result: 'success',
		});
	}
});

// update product master
adminRoute.post('/update-product', async (req, res) => {
	let jsonObj = req.body;

	const response = await updateProduct(jsonObj);

	if (response === 'success') {
		const stockcount = await isStockIdExist({ product_id: jsonObj.product_id, mrp: jsonObj.mrp });

		if (stockcount === 0) {
			// add entry to stock with new mrp and stock as 0
			// add entry in history table with new mrp and stock as same old stock
			let stockid = await insertToStock(jsonObj.product_id, jsonObj.mrp, '0', '0', res);

			let historyAddRes = await insertItemHistoryTable(
				jsonObj.center_id,
				'Product',
				jsonObj.product_id,
				'0',
				'0',
				'0',
				'0',
				'PRD',
				`MRP Change - ${jsonObj.mrp}`,
				'0',
				'0', // sale_return_id
				'0', // sale_return_det_id
				'0', // purchase_return_id
				'0', // purchase_return_det_id
				res,
			);
		}
	}

	res.status(200).json({
		result: 'success',
	});
});

// vendor
adminRoute.get('/get-vendor-details/:centerid/:vendorid', (req, res) => {
	let center_id = req.params.centerid;
	let vendor_id = req.params.vendorid;

	let sql = `select v.*, s.code as code,
	 s.description as state 
	from vendor v, 
	state s where 
	s.id = v.state_id and
	v.id = '${vendor_id}' and
	v.center_id = '${center_id}' order by v.name`;

	pool.query(sql, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', `/get-vendor-details/:centerid/:vendorid ${center_id} ${vendor_id}`, err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

adminRoute.get('/get-states', (req, res) => {
	let sql = `select * from state order by description`;

	pool.query(sql, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', 'get-states', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

adminRoute.get('/get-timezones', (req, res) => {
	let sql = `select * from timezones `;

	pool.query(sql, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', 'get-timezones', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

// vendor

adminRoute.put('/update-vendor/:id', (req, res) => {
	updateVendor(req.body, req.params.id, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', `/update-vendor/:id ${req.params.id}`, err), res);
		} else {
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

// brand
adminRoute.put('/update-brand/:id', (req, res) => {
	updateBrand(req.body, req.params.id, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', `/update-brand/:id ${req.params.id}`, err), res);
		} else {
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

// Add Product, product master
adminRoute.post('/add-vendor', (req, res, next) => {
	let jsonObj = req.body;

	insertVendor(jsonObj, (err, data) => {
		if (err) {
			let errTxt = err.message;
		} else {
			let newPK = data.insertId;
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

// Add Brand,
adminRoute.post('/add-brand', (req, res, next) => {
	let jsonObj = req.body;

	insertBrand(jsonObj, (err, data) => {
		if (err) {
			let errTxt = err.message;
		} else {
			let newPK = data.insertId;
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

// Customers
adminRoute.get('/get-customer-details/:centerid/:customerid', async (req, res) => {
	let rows = await getCustomerDetails(req.params.centerid, req.params.customerid);
	return res.status(200).json(rows);
});

// customers

adminRoute.put('/update-customer/:id', (req, res) => {
	updateCustomer(req.body, req.params.id, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', `/update-customer/:id ${req.params.id}`, err), res);
		} else {
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

adminRoute.post('/add-customer', (req, res) => {
	let jsonObj = req.body;
	insertCustomer(jsonObj, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/add-customer', err), res);
		} else {
			let resdata = JSON.stringify(data);
			return res.status(200).json({
				result: 'success',
				id: data.id,
			});
		}
	});
});

adminRoute.get('/get-center-details/:centerid', async (req, res) => {
	let rows = await getCenterDetails(req.params.centerid);
	return res.status(200).json(rows);
});

adminRoute.post('/update-center', (req, res) => {
	let jsonObj = req.body;

	var objValue = jsonObj['formArray'];

	const basic_info = objValue[0];
	const general_info = objValue[1];
	const addl_info = objValue[2];

	const center_id = basic_info['center_id'];
	const company_id = basic_info['company_id'];

	const name = basic_info['name'];

	const address1 = basic_info['address1'];
	const address2 = basic_info['address2'];
	const address3 = basic_info['address3'];
	const district = basic_info['district'];

	const state_id = basic_info['state_id'];
	const pin = basic_info['pin'];

	const gst = general_info['gst'];
	const phone = general_info['phone'];
	const mobile = general_info['mobile'];
	const mobile2 = general_info['mobile2'];
	const whatsapp = general_info['whatsapp'];

	const email = addl_info['email'];

	const bankname = addl_info['bankname'];
	const accountno = addl_info['accountno'];
	const ifsccode = addl_info['ifsccode'];
	const branch = addl_info['branch'];

	let query = `
	update center set company_id = '${company_id}',
	name = '${name}', address1 = '${address1}',address2 = '${address2}', address3 = '${address3}',
	district = '${district}', state_id = '${state_id}', pin = '${pin}',gst = '${gst}',
	phone = '${phone}', mobile = '${mobile}',mobile2 = '${mobile2}', whatsapp = '${whatsapp}',
	email = '${email}', bankname = '${bankname}', accountno = '${accountno}', ifsccode = '${ifsccode}', branch = '${branch}'
	where
	id = '${center_id}'
	`;

	pool.query(query, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', 'update-center', err), res);
		} else {
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

module.exports = adminRoute;

adminRoute.get('/prod-exists/:pcode/:centerid', (req, res) => {
	let pcode = req.params.pcode;
	let center_id = req.params.centerid;

	let sql = `select * from product p where 
	p.product_code = '${pcode}' and center_id = ${center_id} `;

	pool.query(sql, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', `/prod-exists/:pcode ${pcode}`, err), res);
		} else {
			return res.status(200).json({
				result: data,
			});
		}
	});
});

// ALL CUSTOMER SHIPPING ADDRESS

adminRoute.post('/insert-customer-shipping-address', (req, res) => {
	let jsonObj = req.body;
	insertCustomerShippingAddress(jsonObj, res, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/insert-customer-shipping-address', err), res);
		} else {
			let resdata = JSON.stringify(data);
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

adminRoute.get('/get-shipping-address/:customerid', (req, res) => {
	// @from Customer file
	getCustomerShippingAddress(`${req.params.customerid}`, (err, rows) => {
		if (err) return handleError(new ErrorHandler('500', `/get-shipping-address/:customerid ${req.params.customerid}`, err), res);
		return res.json(rows);
	});
});

// get customer discount values BY CUSTOMER
adminRoute.put('/update-customer-shipping-address/:id', (req, res) => {
	let jsonObj = req.body;

	updateCustomerShippingAddress(req.body, req.params.id, (err, rows) => {
		if (err) return handleError(new ErrorHandler('500', `/update-customer-shipping-address/:id ${req.params.id}`, err), res);
		return res.json(rows);
	});
});

// get customer discount values BY CUSTOMER
adminRoute.post('/inactivate-csa', async (req, res) => {
	let jsonObj = req.body;
	let result = await inactivateCSA(jsonObj.id);

	if (result === 'UPDATED') {
		return res.status(200).json({ message: 'Address Deleted.' });
	} else {
		return res.status(200).json({ message: 'Address Deletion Failed.' });
	}
});

// ALL DISCOUNTS RELATED FUNCTIONS //
// get customer discount values
adminRoute.get('/customer-discount/:centerid/:customerid', (req, res) => {
	// @from Customer file
	getCustomerDiscount(`${req.params.centerid}`, `${req.params.customerid}`, (err, rows) => {
		if (err)
			return handleError(
				new ErrorHandler('500', `/customer-discount/:centerid/:customerid ${req.params.centerid} ${req.params.customerid}`, err),
				res,
			);
		return res.json(rows);
	});
});

// get customer discount values
adminRoute.get('/all-customer-default-discounts/:centerid/:customerid', (req, res) => {
	getAllCustomerDefaultDiscounts(`${req.params.centerid}`, `${req.params.customerid}`, (err, rows) => {
		if (err)
			return handleError(
				new ErrorHandler('500', `/all-customer-default-discounts/:centerid ${req.params.centerid} ${req.params.customerid}`, err),
				res,
			);
		return res.json(rows);
	});
});

// get customer discount values BY CUSTOMER
adminRoute.get('/discounts-customer/:centerid/:customerid', (req, res) => {
	getDiscountsByCustomer(`${req.params.centerid}`, `${req.params.customerid}`, (err, rows) => {
		if (err)
			return handleError(
				new ErrorHandler('500', `/discounts-customer/:centerid/:customerid ${req.params.centerid} ${req.params.customerid}`, err),
				res,
			);
		return res.json(rows);
	});
});

// get customer discount values BY CUSTOMER
adminRoute.get('/discounts-customer-brands/:centerid/:customerid', (req, res) => {
	getDiscountsByCustomerByBrand(`${req.params.centerid}`, `${req.params.customerid}`, (err, rows) => {
		if (err)
			return handleError(
				new ErrorHandler('500', `/discounts-customer-brands/:centerid/:customerid ${req.params.centerid} ${req.params.customerid}`, err),
				res,
			);
		return res.json(rows);
	});
});

// get customer discount values BY CUSTOMER
adminRoute.put('/update-default-customer-discount', (req, res) => {
	let jsonObj = req.body;

	updateDefaultCustomerDiscount(jsonObj, (err, rows) => {
		if (err) return handleError(new ErrorHandler('500', `update-default-customer-discount`, err), res);
		return res.json(rows);
	});
});

// get customer discount values
adminRoute.put('/update-customer-discount', (req, res) => {
	let jsonObj = req.body;

	// @from Customer file
	updateCustomerDiscount(jsonObj, (err, rows) => {
		if (err) return handleError(new ErrorHandler('500', '/update-customer-discount', err), res);
		return res.json(rows);
	});
});

adminRoute.post('/add-discounts-brand', (req, res) => {
	let jsonObj = req.body;
	insertDiscountsByBrands(jsonObj, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/add-discounts-brand', err), res);
		} else {
			let resdata = JSON.stringify(data);
			return res.status(200).json({
				result: 'success',
			});
		}
	});
});

// Add User,
adminRoute.post('/add-user', async (req, res, next) => {
	let jsonObj = req.body;

	let check = await isUserExist(jsonObj);
	if (check === 'DUP_USERNAME') {
		return res.status(200).json({ message: 'DUP_USERNAME' });
	} else {
		let id = await insertUser(jsonObj);

		if (id !== null || id !== '' || id !== undefined) {
			let userrole = await insertUserRole({
				user_id: id,
				role_id: req.body.role_id,
			});

			return res.status(200).json({ message: 'User Inserted' });
		}
	}
});

// update user status
adminRoute.post('/update-user-status', async (req, res, next) => {
	let jsonObj = req.body;

	let id = await updateUserStatus(jsonObj);

	if (id !== 0) {
		return res.status(200).json({ message: 'User Status Updated.' });
	} else {
		return res.status(200).json({ message: 'User Status Update Failed.' });
	}
});

// get users
adminRoute.get('/get-users/:centerid/:status', async (req, res) => {
	let rows = await getUsers(req.params.centerid, req.params.status);
	return res.status(200).json(rows);
});

adminRoute.get('/usename-exists/:phone/:centerid', async (req, res) => {
	let user = await checkUsernameExists(req.params.phone, req.params.centerid);
	if (user !== null) {
		return res.status(200).json({ message: 'NEW_USER' });
	} else {
		return res.status(200).json({ message: 'ALREADY_EXIST' });
	}
});

// get customer outstanding balance
adminRoute.post('/get-outstanding-balance', async (req, res) => {
	let rows = await getOutstandingBalance(req.body.center_id, req.body.limit);

	return res.status(200).json(rows);
});

adminRoute.post('/add-bank', async (req, res, next) => {
	let insertValues = req.body;

	let id = await insertBank(insertValues);

	if (id === 'success') {
		if (req.body.isdefault) {
			// update center with this bank details, if isdefault is true
			let response = await updateCenterBankInfo(insertValues);

			if (response === 'success') {
				return res.status(200).json({ message: 'success' });
			} else {
				return res.status(200).json({ message: 'Error' });
			}
		} else {
			return res.status(200).json({ message: 'success' });
		}
	} else {
		return res.status(200).json({ message: 'Error' });
	}
});

adminRoute.post('/update-bank', async (req, res, next) => {
	let insertValues = req.body;

	// update BANK DEFAULT to N if default enabled
	if (req.body.isdefault) {
		let updateDefaults = await updateBankDefaults(insertValues.center_id);
	}

	// update bank details
	let id = await updateBank(insertValues);

	if (id === 'success') {
		if (req.body.isdefault) {
			// if default enabled, update center table
			let response = await updateCenterBankInfo(insertValues);

			if (response === 'success') {
				return res.status(200).json({ message: 'success' });
			} else {
				return res.status(200).json({ message: 'Error' });
			}
		} else {
			return res.status(200).json({ message: 'success' });
		}
	} else {
		return res.status(200).json({ message: 'Error' });
	}
});
