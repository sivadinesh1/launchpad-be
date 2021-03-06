const express = require('express');
const accountsRouter = express.Router();

var pool = require('../../config/db');

const { handleError, ErrorHandler } = require('../../config/error');
const { toTimeZone, currentTimeInTimeZone } = require('../../utils/utils');

const {
	addPaymentMaster,
	getLedgerByCustomers,
	getSaleInvoiceByCustomers,
	getPaymentsByCustomers,
	getPaymentsOverviewByCustomers,
	addPaymentLedgerRecord,
	updatePymtSequenceGenerator,
	getPymtSequenceNo,
	getPaymentsByCenter,
	getSaleInvoiceByCenter,
	getPymtTransactionsByCenter,
	updateCustomerCredit,
	updateCustomerCreditMinus,
	getPymtTransactionByCustomers,
	bankList,
	paymentBankRef,
	lastPaymentRecord,
	lastVendorPaymentRecord,
	getPaymentsOverviewByCenter,
} = require('../../services/accounts.service');

accountsRouter.post('/add-payment-received', async (req, res) => {
	var today = new Date();
	today = currentTimeInTimeZone('Asia/Kolkata', 'YYYY-MM-DD HH:mm:ss');

	const cloneReq = { ...req.body };

	const [customer, center_id, accountarr] = Object.values(req.body);

	let index = 0;

	for (const k of accountarr) {
		await updatePymtSequenceGenerator(center_id);

		let pymtNo = await getPymtSequenceNo(cloneReq);

		// add payment master
		let newPK = await addPaymentMaster(cloneReq, pymtNo, k, res);

		// (3) - updates pymt details
		let process = processItems(cloneReq, newPK, k.sale_ref_id, k.receivedamount);

		if (index == accountarr.length - 1) {
			return res.status(200).json('success');
		}
		index++;
		// });
	}
});

function processItems(cloneReq, newPK, sale_ref_id, receivedamount) {
	let sql = `INSERT INTO payment_detail(pymt_ref_id, sale_ref_id, applied_amount) VALUES
		( '${newPK}', '${sale_ref_id}', '${receivedamount}' )`;

	let pymtdetailsTblPromise = new Promise(function (resolve, reject) {
		pool.query(sql, function (err, data) {
			if (err) {
				reject(err);
			} else {
				// check if there is any credit balance for the customer, if yes, first apply that

				addPaymentLedgerRecord(cloneReq, newPK, receivedamount, sale_ref_id, (err, data) => {
					if (err) {
						let errTxt = err.message;
					} else {
						// todo
					}
				});

				resolve(data);
			}
		});
	});
}

accountsRouter.get('/get-ledger-customer/:centerid/:customerid', (req, res) => {
	getLedgerByCustomers(req.params.centerid, req.params.customerid, (err, data) => {
		if (err) {
			return handleError(
				new ErrorHandler('500', `/get-ledger-customer/:centerid/:customerid ${req.params.centerid} ${req.params.customerid}`, err),
				res,
			);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/get-sale-invoice-customer', (req, res) => {
	let center_id = req.body.centerid;
	let from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata');
	let to_date = toTimeZone(req.body.todate, 'Asia/Kolkata');
	let customer_id = req.body.customerid;
	let searchtype = req.body.searchtype;
	let invoiceno = req.body.invoiceno;

	getSaleInvoiceByCustomers(center_id, customer_id, from_date, to_date, searchtype, invoiceno, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/get-sale-invoice-customer', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/get-sale-invoice-center', (req, res) => {
	let center_id = req.body.centerid;
	let from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata');
	let to_date = toTimeZone(req.body.todate, 'Asia/Kolkata');
	let customer_id = req.body.customerid;
	let searchtype = req.body.searchtype;
	let invoiceno = req.body.invoiceno;

	getSaleInvoiceByCenter(center_id, from_date, to_date, customer_id, searchtype, invoiceno, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/get-sale-invoice-center', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/get-payments-customer', (req, res) => {
	let center_id = req.body.centerid;
	let from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata');
	let to_date = toTimeZone(req.body.todate, 'Asia/Kolkata');
	let customer_id = req.body.customerid;
	let searchtype = req.body.searchtype;
	let invoiceno = req.body.invoiceno;

	getPaymentsByCustomers(center_id, customer_id, from_date, to_date, searchtype, invoiceno, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/get-payments-customer', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/get-payments-overview-customer', async (req, res) => {
	let center_id = req.body.centerid;
	let from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata');
	let to_date = toTimeZone(req.body.todate, 'Asia/Kolkata');
	let customer_id = req.body.customerid;
	let searchtype = req.body.searchtype;

	const data = await getPaymentsOverviewByCustomers(center_id, customer_id, from_date, to_date, searchtype, res);
	return res.status(200).json(data);
});

accountsRouter.get('/get-pymt-transactions-customer/:centerid/:customerid', (req, res) => {
	getPymtTransactionByCustomers(req.params.centerid, req.params.customerid, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/get-pymt-transactions-customer/:centerid/:customerid', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/get-payments-center', (req, res) => {
	let center_id = req.body.centerid;
	let from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata');
	let to_date = toTimeZone(req.body.todate, 'Asia/Kolkata');
	let customer_id = req.body.customerid;
	let searchtype = req.body.searchtype;
	let invoiceno = req.body.invoiceno;

	getPaymentsByCenter(center_id, from_date, to_date, customer_id, searchtype, invoiceno, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/get-payments-center', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/get-payments-overview-center', async (req, res) => {
	let center_id = req.body.centerid;
	let from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata');
	let to_date = toTimeZone(req.body.todate, 'Asia/Kolkata');
	let customer_id = req.body.customerid;
	let searchtype = req.body.searchtype;

	let data = await getPaymentsOverviewByCenter(center_id, from_date, to_date, customer_id, searchtype, res);

	return res.status(200).json(data);
});

accountsRouter.get('/get-pymt-transactions-center/:centerid', (req, res) => {
	getPymtTransactionsByCenter(req.params.centerid, (err, data) => {
		if (err) {
			return handleError(new ErrorHandler('500', '/get-pymt-transactions-center/:centerid', err), res);
		} else {
			return res.status(200).json(data);
		}
	});
});

accountsRouter.post('/add-bulk-payment-received', async (req, res) => {
	const cloneReq = { ...req.body };

	const [customer, center_id, accountarr, invoicesplit, balanceamount] = Object.values(req.body);

	let index = 0;

	for (const k of accountarr) {
		await updatePymtSequenceGenerator(center_id);

		let pymtNo = await getPymtSequenceNo(cloneReq);

		// add payment master
		let newPK = await addPaymentMaster(cloneReq, pymtNo, k, res);

		// (3) - updates pymt details
		let process = processBulkItems(cloneReq, newPK, invoicesplit);

		if (index == accountarr.length - 1) {
			if (req.body.creditsused === 'YES') {
				updateCustomerCreditMinus(req.body.creditusedamount, cloneReq.centerid, cloneReq.customer.id, (err, data1) => {
					if (err) {
						let errTxt = err.message;
					} else {
						// todo nothing
					}
				});
			}

			// apply the excess amount to custome credit
			// applicable only if balanceamount < 0
			if (balanceamount < 0) {
				updateCustomerCredit(balanceamount, cloneReq.centerid, cloneReq.customer.id, (err, data1) => {
					if (err) {
						let errTxt = err.message;
					} else {
						// todo nothing
					}
				});
			}
			return res.status(200).json('success');
		}
		index++;
	}
});

function processBulkItems(cloneReq, newPK, invoicesplit) {
	invoicesplit.forEach((e) => {
		let sql = `INSERT INTO payment_detail(pymt_ref_id, sale_ref_id, applied_amount) VALUES
		( '${newPK}', '${e.id}', '${e.applied_amount}' )`;

		let pymtdetailsTblPromise = new Promise(function (resolve, reject) {
			pool.query(sql, function (err, data) {
				if (err) {
					reject(err);
				} else {
					// check if there is any credit balance for the customer, if yes, first apply that

					addPaymentLedgerRecord(cloneReq, newPK, e.applied_amount, e.id, (err, data2) => {
						if (err) {
							let errTxt = err.message;
						} else {
							// do nothing
						}
					});
					resolve(data);
				}
			});
		});
	});
}

accountsRouter.get('/banks-list/:centerid', async (req, res) => {
	let center_id = req.params.centerid;
	let result = await bankList(center_id);

	if (result.status === 'error') {
		handleError(new ErrorHandler('500', '/banks-list', result.response), res);
	} else if (result.status === 'success') {
		return res.status(200).json({
			result: result.response,
		});
	}
});

// isBankRefExists
accountsRouter.post('/pymt-bank-ref-exist', async (req, res) => {
	let center_id = req.body.centerid;
	let bank_ref = req.body.bankref;
	let customer_id = req.body.customerid;

	let result = await paymentBankRef(center_id, bank_ref, customer_id, 'payment');

	if (result.status === 'error') {
		handleError(new ErrorHandler('500', '/pymt-bank-ref-exist', result.response), res);
	} else if (result.status === 'success') {
		let result1 = await lastPaymentRecord(center_id, customer_id);

		return res.status(200).json({
			result: result.response,
			result1: result1.response,
		});
	}
});

accountsRouter.post('/vendor-pymt-bank-ref-exist', async (req, res) => {
	let center_id = req.body.centerid;
	let bank_ref = req.body.bankref;
	let vendor_id = req.body.vendorid;

	let result = await paymentBankRef(center_id, bank_ref, vendor_id, 'vendorpayment');

	if (result.status === 'error') {
		handleError(new ErrorHandler('500', '/vendor-pymt-bank-ref-exist', result.response), res);
	} else if (result.status === 'success') {
		let result1 = await lastVendorPaymentRecord(center_id, vendor_id);

		return res.status(200).json({
			result: result.response,
			result1: result1.response,
		});
	}
});

module.exports = accountsRouter;
