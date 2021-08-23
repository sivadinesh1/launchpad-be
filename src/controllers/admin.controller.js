const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { responseForward } = require('../utils/utils');
const catchAsync = require('../utils/catchAsync');
const {
	adminService,
	customersService,
	productsService,
	vendorsService,
	brandsService,
	authService,
	stockService,
	centerService,
} = require('../services');

const getProductsCount = catchAsync(async (req, res) => {
	const data = await adminService.getProductsCount(req.params.centerid);

	return responseForward(data, 'getProductsCount', res);
});

const getProductInfo = catchAsync(async (req, res) => {
	const data = await adminService.getProductInfo(req.params.centerid, req.params.productid);

	return responseForward(data, 'getProductInfo', res);
});

const addProduct = catchAsync(async (req, res) => {
	const data = await productsService.insertProduct(req.body);
	return responseForward(data, 'addProduct', res);
});

const updateProduct = catchAsync(async (req, res) => {
	const jsonObj = req.body;
	const response = await productsService.updateProduct(jsonObj);

	if (response === 'success') {
		const stockcount = await stockService.isStockIdExist({ product_id: jsonObj.product_id, mrp: jsonObj.mrp });

		if (stockcount === 0) {
			// add entry to stock with new mrp and stock as 0
			// add entry in history table with new mrp and stock as same old stock
			let stockid = await stockService.insertToStock(jsonObj.product_id, jsonObj.mrp, '0', '0');

			let data = await stockService.insertItemHistoryTable(
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
			);

			if (!data) {
				throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error adding new product');
			}
		}
		res.status(200).json({
			result: 'success',
		});
	}
});

const getVendorDetails = catchAsync(async (req, res) => {
	const data = await vendorsService.getVendorDetails(req.params.centerid, req.params.vendorid);

	return responseForward(data, 'getVendorDetails', res);
});

const getStates = catchAsync(async (req, res) => {
	const data = await adminService.getStates();

	return responseForward(data, 'getStates', res);
});

const getTimezones = catchAsync(async (req, res) => {
	const data = await adminService.getTimezones();

	return responseForward(data, 'getTimezones', res);
});

const updateVendor = catchAsync(async (req, res) => {
	const data = await vendorsService.updateVendor(req.body, req.params.id);
	return responseForward(data, 'updateVendor', res);
});

const updateBrand = catchAsync(async (req, res) => {
	const data = await brandsService.updateBrand(req.body, req.params.id);
	return responseForward(data, 'updateBrand', res);
});

const addVendor = catchAsync(async (req, res) => {
	const data = await vendorsService.insertVendor(req.body);
	return responseForward(data, 'addVendor', res, httpStatus.CREATED);
});
// console.info(status[500]);
// console.info(status[status.INTERNAL_SERVER_ERROR]);
const addBrand = catchAsync(async (req, res) => {
	const data = await brandsService.insertBrand(req.body);
	return responseForward(data, 'addBrand', res);
});

const getCustomerDetails = catchAsync(async (req, res) => {
	const data = await customersService.getCustomerDetails(req.params.centerid, req.params.customerid);

	return responseForward(data, 'getCustomerDetails', res);
});

const addCustomer = catchAsync(async (req, res) => {
	const data = await customersService.insertCustomer(req.body);
	return responseForward(data, 'getCustomerDetails', res);
});

const updateCustomer = catchAsync(async (req, res) => {
	const data = await customersService.updateCustomer(req.body, req.params.id);

	return responseForward(data, 'updateCustomer', res);
});

const getCenterDetails = catchAsync(async (req, res) => {
	const data = await centerService.getCenterDetails(req.params.centerid);

	return responseForward(data, 'getCenterDetails', res);
});

const updateCenter = catchAsync(async (req, res) => {
	const data = await centerService.updateCenter(req);
	return responseForward(data, 'updateCenter', res);
});

const isProductExists = catchAsync(async (req, res) => {
	const data = await productsService.isProductExists(req.params.pcode, req.params.centerid);

	return responseForward(data, 'isProductExists', res);
});

const addCustomerShippingAddress = catchAsync(async (req, res) => {
	const data = await customersService.insertCustomerShippingAddress(req.body);
	return responseForward(data, 'addCustomerShippingAddress', res);
});

const getCustomerShippingAddress = catchAsync(async (req, res) => {
	const data = await customersService.getCustomerShippingAddress(req.params.customerid);

	return responseForward(data, 'getCustomerShippingAddress', res);
});

const updateCustomerShippingAddress = catchAsync(async (req, res) => {
	const data = await customersService.updateCustomerShippingAddress(req.body, req.params.id);

	return responseForward(data, 'updateCustomerShippingAddress', res);
});

const inactivateCSA = catchAsync(async (req, res) => {
	const data = await customersService.inactivateCSA(req.body.id);
	return responseForward(data, 'inactivateCSA', res);
});

const getCustomerDiscount = catchAsync(async (req, res) => {
	const data = await customersService.getCustomerDiscount(req.params.centerid, req.params.customerid);

	return responseForward(data, 'getCustomerDiscount', res);
});

const getAllCustomerDefaultDiscounts = catchAsync(async (req, res) => {
	const data = await customersService.getAllCustomerDefaultDiscounts(req.params.centerid, req.params.customerid);

	return responseForward(data, 'getAllCustomerDefaultDiscounts', res);
});

const getDiscountsByCustomer = catchAsync(async (req, res) => {
	const data = await customersService.getDiscountsByCustomer(req.params.centerid, req.params.customerid);
	return responseForward(data.ApiError, 'getDiscountsByCustomer', res);
});

const getDiscountsByCustomerByBrand = catchAsync(async (req, res) => {
	const data = await customersService.getDiscountsByCustomerByBrand(req.params.centerid, req.params.customerid);
	return responseForward(data, 'Error: getDiscountsByCustomerByBrand', res);
});

const updateDefaultCustomerDiscount = catchAsync(async (req, res) => {
	const data = await customersService.updateDefaultCustomerDiscount(req.params.centerid, req.params.customerid);
	return responseForward(data, 'Error: updateDefaultCustomerDiscount', res);
});

const updateCustomerDiscount = catchAsync(async (req, res) => {
	const data = await customersService.updateCustomerDiscount(req.params.centerid, req.params.customerid);

	return responseForward(data, 'Error: updateCustomerDiscount', res);
});

const insertDiscountsByBrands = catchAsync(async (req, res) => {
	const data = await customersService.insertDiscountsByBrands(req.body);

	return responseForward(data, 'Error: insertDiscountsByBrands', res);
});

const addUser = catchAsync(async (req, res) => {
	const data = await adminService.addUser(req.body);

	return responseForward(data, 'Error: addUser', res);
});

const updateUser = catchAsync(async (req, res) => {
	const data = await adminService.updateUserStatus(req.body);

	return responseForward(data, 'Error: updateUser', res);
});

const getUsers = catchAsync(async (req, res) => {
	const data = await adminService.getUsers(req.params.centerid, req.params.status);

	return responseForward(data, 'Error: getUsers', res);
});

const checkUsernameExists = catchAsync(async (req, res) => {
	const data = await authService.checkUsernameExists(req.params.phone, req.params.centerid);

	return responseForward(data, 'Error: checkUsernameExists', res);
});

const getOutstandingBalance = catchAsync(async (req, res) => {
	const data = await adminService.getOutstandingBalance(req.body.center_id, req.body.limit);

	return responseForward(data, 'Error: getOutstandingBalance', res);
});

const addBank = catchAsync(async (req, res) => {
	const data = await adminService.addBank(req.body);

	return responseForward(data, 'Error: addBank', res);
});

const updateBank = catchAsync(async (req, res) => {
	const data = await adminService.updateBank(req.body);

	return responseForward(data, 'Error: updateBank', res);
});

module.exports = {
	getProductsCount,
	getProductInfo,
	addProduct,
	updateProduct,
	getVendorDetails,
	getStates,
	getTimezones,
	updateVendor,
	updateBrand,

	addVendor,
	addBrand,
	getCustomerDetails,
	addCustomer,
	updateCustomer,
	getCenterDetails,
	updateCenter,
	isProductExists,
	addCustomerShippingAddress,
	getCustomerShippingAddress,
	updateCustomerShippingAddress,
	inactivateCSA,
	getCustomerDiscount,
	getAllCustomerDefaultDiscounts,
	getDiscountsByCustomer,
	getDiscountsByCustomerByBrand,
	updateDefaultCustomerDiscount,
	updateCustomerDiscount,
	insertDiscountsByBrands,
	addUser,
	updateUser,
	getUsers,
	checkUsernameExists,
	getOutstandingBalance,
	addBank,
	updateBank,
};
