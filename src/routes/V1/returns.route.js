// refund status - Pending (P), Partially Refunded (PR), Refunded (R)
// receive status - not received (NR) received (R), partially received (PR)
// status - approved (A), closed (C)

const express = require('express');
const returnsRouter = express.Router();

const { handleError, ErrorHandler } = require('../../config/error');

const { getReturns, saleReturnPaymentMaster } = require('../../services/returns.service');

const { toTimeZone, currentTimeInTimeZone } = require('../../utils/utils');

const { updatePymtSequenceGenerator, getPymtSequenceNo } = require('../../services/accounts.service');

const {
	insertSaleReturns,
	insertSaleReturnDetail,
	createCreditNote,
	updateCRAmntToCustomer,
	updateCRSequenceGenerator,
	getSequenceCrNote,
	updateCrNoteIdInSaleReturnTable,
	getSaleReturnDetails,
} = require('../../services/returns.service');

var pool = require('../../config/db');

// get sale master to display in sale invoice component
returnsRouter.get('/get-sale-returns/:center_id', async (req, res) => {
	let center_id = req.params.center_id;
	let saleReturns = await getReturns(center_id);

	return res.json(saleReturns);
});

returnsRouter.post('/search-sale-return', (req, res) => {
	let center_id = req.body.centerid;

	let customer_id = req.body.customerid;
	let from_date = req.body.fromdate;
	let to_date = req.body.todate;

	let search_type = req.body.searchtype;
	let search_by = req.body.searchby;

	let sql = '';
	let query = '';

	if (search_type === 'all') {
		if (from_date !== '') {
			from_date = toTimeZone(req.body.fromdate, 'Asia/Kolkata') + ' 00:00:00';
		}

		if (to_date !== '') {
			to_date = toTimeZone(req.body.todate, 'Asia/Kolkata') + ' 23:59:00';
		}

		let custsql = `and s.customer_id = '${customer_id}' `;

		sql = `select c.name, sr.id as sale_return_id, sr.sale_id as sale_id,  s.invoice_no as invoice_no, s.invoice_date as invoice_date,
		sr.return_date as return_date,
		sr.cr_note_id as cr_note_id, cn.credit_note_no, sr.center_id as center_id, sr.to_return_amount as to_return_amount, sr.amount_returned as amount_returned, 
		sr.refund_status as refund_status, 
		(CASE
			WHEN sr.refund_status = 'P' THEN 'Pending'
			WHEN sr.refund_status = 'PR' THEN 'Partially Refunded'
			WHEN sr.refund_status = 'R' THEN 'Refunded'
			END
			) AS refund_status_x,
		sr.to_receive_items as to_receive_items, sr.received_items as received_items, 
		sr.receive_status as receive_status, 
		(CASE
			WHEN sr.receive_status = 'R' THEN 'Received'
			WHEN sr.receive_status = 'PR' THEN 'Partially Received'
			WHEN sr.receive_status = 'NR' THEN 'Not Received'
			END
			) AS receive_status_x,
		sr.return_status as return_status,
		(CASE
			WHEN sr.return_status = 'C' THEN 'Close'
			WHEN sr.return_status = 'A' THEN 'Approved'
			END
			) AS return_status_x
		
		from 
		sale_return sr
		LEFT outer JOIN credit_note cn
					ON cn.id = sr.cr_note_id, 
		sale s,
		customer c
		where
		c.id = s.customer_id and
		sr.sale_id = s.id and
		sr.center_id = '${center_id}' and
		
		
				str_to_date(sr.return_date,  '%d-%m-%Y %T') between
						str_to_date('${from_date}',  '%d-%m-%Y %T') and
						str_to_date('${to_date}',  '%d-%m-%Y %T') 
						
						 `;

		if (customer_id !== 'all') {
			sql = sql + custsql;
		}

		sql = sql + ' order by sr.return_date desc ';
	} else if (search_type !== 'all') {
		query = ` 
		select c.name, sr.id as sale_return_id, sr.sale_id as sale_id, s.invoice_no as invoice_no, s.invoice_date as invoice_date,
		sr.return_date as return_date,
		sr.cr_note_id as cr_note_id, cn.credit_note_no, sr.center_id as center_id, sr.to_return_amount as to_return_amount, sr.amount_returned as amount_returned, 
		sr.refund_status as refund_status, 
		(CASE
			WHEN sr.refund_status = 'P' THEN 'Pending'
			WHEN sr.refund_status = 'PR' THEN 'Partially Refunded'
			WHEN sr.refund_status = 'R' THEN 'Refunded'
			END
			) AS refund_status_x,
		sr.to_receive_items as to_receive_items, sr.received_items as received_items, 
		sr.receive_status as receive_status, 
		(CASE
			WHEN sr.receive_status = 'R' THEN 'Received'
			WHEN sr.receive_status = 'PR' THEN 'Partially Received'
			END
			) AS receive_status_x,
		sr.return_status as return_status,
		(CASE
			WHEN sr.return_status = 'C' THEN 'Close'
			WHEN sr.return_status = 'A' THEN 'Approved'
			END
			) AS return_status_x
		
		from 
		sale_return sr
		LEFT outer JOIN credit_note cn
					ON cn.id = sr.cr_note_id, 
		sale s,
		customer c
		where
		c.id = s.customer_id and
		sr.sale_id = s.id and
		sr.center_id = '${center_id}' and `;

		if (search_type === 'byinvoice') {
			query = query + ` s.invoice_no = '${search_by.trim()}' order by sr.return_date desc `;
		} else if (search_type === 'bycreditnote') {
			query = query + ` cn.credit_note_no = '${search_by.trim()}' order by sr.return_date desc `;
		}
	}

	pool.query(search_type === 'all' ? sql : query, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', 'Error fetching search-sale-return', err), res);
		} else {
			return res.json(data);
		}
	});
});

returnsRouter.get('/get-sale-return-details/:center_id/:salre_return_id', (req, res) => {
	let center_id = req.params.center_id;
	let sale_return_id = req.params.salre_return_id;

	let data = getSaleReturnDetails(center_id, sale_return_id);

	return res.json(data);
});

returnsRouter.post('/update-sale-returns-received', (req, res) => {
	let returnArr = req.body;

	let count = 0;

	for (const k of returnArr) {
		let query = `			
					update sale_return_detail T1, sale_return T2
					set 
					T1.received_qty = T1.received_qty + ${k.received_now},
					T2.received_items = T2.received_items + ${k.received_now},
					T2.receive_status = IF(T2.to_receive_items = (T2.received_items + ${k.received_now}), 'R', T2.receive_status),
					T2.return_status = IF(T2.to_receive_items = (T2.received_items + ${k.received_now}), 'C', T2.return_status)
					where 
					T1.sale_return_id = T2.id and
					T1.id = '${k.id}'				
					`;

		pool.query(query, function (err, data) {
			if (err) {
				return handleError(new ErrorHandler('500', 'Error updating update-sale-returns-received', err), res);
			} else {
			}
		});

		count++;
		if (count === returnArr.length) {
			res.json({
				result: 'success',
			});
		}
	}
});

// get sale master to display in sale invoice component
returnsRouter.get('/show-receive-button/:center_id/:sale_return_id', async (req, res) => {
	let center_id = req.params.center_id;
	let sale_return_id = req.params.sale_return_id;

	let query = `
			select count(*) as cnt from sale_return_detail 
			where 
			return_qty > received_qty and  
			sale_return_id = ${sale_return_id} `;

	pool.query(query, function (err, data) {
		if (err) {
			return handleError(new ErrorHandler('500', `Error /show-receive-button/:center_id/:sale_return_id ${center_id} ${sale_return_id} `, err), res);
		} else {
			return res.json(data);
		}
	});
});

/*
Sale return & Create Credit Note + update credit_amt in customer table
Steps: 
1. insert sale_return
2. update sale_details on how many returned 
3. insert sale_return_detail table with details of what is returned and at what price
4. Increase the stock
*/
returnsRouter.post('/add-sale-return', async (req, res) => {
	var today = new Date();
	today = currentTimeInTimeZone('Asia/Kolkata', 'DD-MM-YYYY');

	let reqObject = req.body;

	let smd = reqObject[1]; // sale master data
	let srd = reqObject[0]; // salre return details

	const sale_return_id = await insertSaleReturns(smd);

	const job_completed = await insertSaleReturnDetail(srd, sale_return_id, smd, res);

	updateCRSequenceGenerator(smd.center_id);
	let fetchCRNoteNo = await getSequenceCrNote(smd.center_id);

	let cr_note_id_created = await createCreditNote(fetchCRNoteNo, smd.to_return_amount, 'R');
	updateCrNoteIdInSaleReturnTable(cr_note_id_created, sale_return_id);

	// dinesh - delete this logic
	//let cr_note_updated = await updateCRAmntToCustomer(smd.sale_id, smd.to_return_amount);

	// add a payment entry
	await updatePymtSequenceGenerator(smd.center_id);

	let cloneReq = {
		centerid: smd.center_id,
		bank_id: 0,
		accountarr: [{ receivedamount: smd.to_return_amount, receiveddate: today }],
	};
	let pymtNo = await getPymtSequenceNo(cloneReq);

	// add payment master
	// nst saleReturnPaymentMaster = (center_id, customer_id, payment_no,
	// 	payment_now_amt, advance_amt_used, pymt_date ) => {
	let newPK = await saleReturnPaymentMaster(smd.center_id, smd.customer_id, pymtNo, smd.to_return_amount, '0', today, res);

	// (3) - updates pymt details
	let process = await processItems(newPK.insertId, smd.sale_id, sale_return_id, smd.to_return_amount);

	Promise.all([sale_return_id, job_completed, fetchCRNoteNo, cr_note_id_created, process]).then((result) => {
		return res.json('success');
	});
});

function processItems(newPK, sale_ref_id, sale_return_ref_id, receivedamount) {
	let sql = `INSERT INTO payment_detail(pymt_ref_id, sale_ref_id, sale_return_ref_id, applied_amount) VALUES
		( '${newPK}', '${sale_ref_id}', '${sale_return_ref_id}', '${receivedamount}'  )`;

	return new Promise(function (resolve, reject) {
		pool.query(sql, function (err, data) {
			if (err) {
				reject(err);
			} else {
				// check if there is any credit balance for the customer, if yes, first apply that

				// addPaymentLedgerRecord(cloneReq, newPK, receivedamount, sale_ref_id, (err, data) => {
				// 	if (err) {
				// 		let errTxt = err.message;
				// 	} else {
				// 		// todo
				// 	}
				// });

				resolve(data);
			}
		});
	});
}

module.exports = returnsRouter;

// Select Count(client.*) From Client client
// Inner Join Subscription sub On sub.client_id = client.id
// Where DATE_TODAY Between sub.start And sub.end
