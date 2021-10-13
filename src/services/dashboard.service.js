var pool = require('../config/db');

const { currentTimeInTimeZone, bigIntToString, promisifyQuery } = require('../utils/utils');

const getInquirySummary = (center_id, from_date, to_date) => {
	let query = ` select 
  IFNULL(SUM(CASE WHEN e.e_status = 'O' THEN 1 ELSE 0 END), 0) AS 'new',
  IFNULL(SUM(CASE WHEN e.e_status = 'D' THEN 1 ELSE 0 END), 0) AS 'draft',
  IFNULL(SUM(CASE WHEN e.e_status = 'E' THEN 1 ELSE 0 END), 0) AS 'executed',
  IFNULL(SUM(CASE WHEN e.e_status = 'P' THEN 1 ELSE 0 END), 0) AS 'invoiceready',
  IFNULL(SUM(CASE WHEN e.e_status = 'C' THEN 1 ELSE 0 END), 0) AS 'completed',
  IFNULL(SUM(CASE WHEN e.e_status = 'X' THEN 1 ELSE 0 END), 0) AS 'cancelled'                   
from
enquiry e
where
e.center_id =  '${center_id}' and
str_to_date(DATE_FORMAT(enquiry_date,'%d-%m-%YYYY') , '%d-%m-%YYYY') between
str_to_date('${from_date}', '%d-%m-%YYYY') and
str_to_date('${to_date}', '%d-%m-%YYYY')  `;

	return promisifyQuery(query);
};

const getSalesSummary = (center_id, from_date, to_date) => {
	let query = ` select 
  IFNULL(SUM(CASE WHEN s.status = 'C' THEN 1 ELSE 0 END), 0) AS 'completed',
  IFNULL(SUM(CASE WHEN s.status = 'D' THEN 1 ELSE 0 END), 0) AS 'draft'
from
sale s
where
s.center_id =  '${center_id}' and
STR_TO_DATE(s.invoice_date,'%d-%m-%Y') between
str_to_date('${from_date}', '%d-%m-%YYYY') and
str_to_date('${to_date}', '%d-%m-%YYYY')      
 `;

	return promisifyQuery(query);
};

const getPurchaseSummary = (center_id, from_date, to_date) => {
	let query = ` select 
  IFNULL(SUM(CASE WHEN p.status = 'C' THEN 1 ELSE 0 END), 0) AS 'completed',
  IFNULL(SUM(CASE WHEN p.status = 'D' THEN 1 ELSE 0 END), 0) AS 'draft'
from
purchase p
where
p.center_id =  '${center_id}' and
STR_TO_DATE(p.invoice_date,'%d-%m-%Y') between
str_to_date('${from_date}', '%d-%m-%YYYY') and
str_to_date('${to_date}', '%d-%m-%YYYY')          
 `;

	return promisifyQuery(query);
};

const getSaleTotal = (center_id, from_date, to_date) => {
	let query = ` 

  select 
    IFNULL(SUM(s.net_total), 0) AS 'sales_total'
  from
  sale s
  where
  s.center_id =  '${center_id}' and
STR_TO_DATE(s.invoice_date,'%d-%m-%Y') between
str_to_date('${from_date}', '%d-%m-%YYYY') and
str_to_date('${to_date}', '%d-%m-%YYYY')      
          
 `;

	return promisifyQuery(query);
};

const getCenterSummary = (center_id, from_date, to_date) => {
	let query = ` select tbl1.active_customers, tbl2.active_vendors from (
    select count(*) as 'active_customers' from customer where is_active = 'A' and center_id = '${center_id}' ) as tbl1,
    (
    select count(*) as 'active_vendors' from vendor where is_active = 'A' and center_id = '${center_id}'
    ) as tbl2 `;

	return promisifyQuery(query);
};

const getReceivablesOutstanding = (center_id, from_date, to_date) => {
	let query = ` select customer_id, (sum(credit_amt) - sum(debit_amt)) as balance from 
  ledger l
  where
  l.center_id = '${center_id}' 
  group by
  customer_id
   `;

	return promisifyQuery(query);
};

const getPaymentsByCustomers = (center_id, from_date, to_date) => {
	let query = ` select c.name as customer_name, p.payment_now_amt
  from 
  payment p,
  customer c
  where
  c.id = p.customer_id and
  p.center_id =  '${center_id}' and
  STR_TO_DATE(p.payment_date,'%d-%m-%Y') between
  str_to_date('${from_date}', '%d-%m-%YYYY') and
  str_to_date('${to_date}', '%d-%m-%YYYY')    
   `;

	return promisifyQuery(query);
};

const topClients = (requestBody) => {
	let query = `
		select c.name as customer_name, s.customer_id as id, sum(net_total) as sum_total,
		count(s.id) as inv_count
		from 
			sale s,
			customer c
		where
			c.id = s.customer_id and
			s.center_id = '${requestBody.center_id}'
			group by customer_id 
		order by
			sum_total desc
			limit ${requestBody.limit} `;

	return promisifyQuery(query);
};

module.exports = {
	getInquirySummary,
	getSalesSummary,
	getPurchaseSummary,
	getSaleTotal,
	getCenterSummary,
	getReceivablesOutstanding,
	getPaymentsByCustomers,
	topClients,
};
