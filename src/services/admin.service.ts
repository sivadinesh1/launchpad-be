import prisma from '../config/prisma';

const { currentTimeInTimeZone, bigIntToString } = require('../utils/utils');

const { insertUser, insertUserRole, checkUserExist } = require('../services/user.service');

export const getProductsCount = async (center_id: any) => {
	const result = await prisma.product.count({
		where: {
			center_id: Number(center_id),
		},
	});

	return result;
};

export const getProductInfo = async (center_id: any, product_id: any) => {
	const result = await prisma.product.findMany({
		where: {
			id: Number(product_id),
			center_id: Number(center_id),
		},
		include: {
			brand: true,
		},
	});
	return bigIntToString(result);
};

export const getStates = async () => {
	const result = await prisma.state.findMany({
		orderBy: {
			description: 'asc',
		},
	});
	return bigIntToString(result);
};

export const getTimezones = async () => {
	const result = await prisma.timezones.findMany({
		orderBy: {
			description: 'asc',
		},
	});
	return bigIntToString(result);
};

export const addUser = async (jsonObj: any) => {
	const user = await checkUserExist(jsonObj);
	if (user !== null) {
		return { message: 'DUP_USERNAME' };
	} else {
		let id = await insertUser(jsonObj);

		if (id !== null || id !== '' || id !== undefined) {
			let userrole = await insertUserRole({
				user_id: id,
				role_id: jsonObj.role_id,
			});

			return { message: 'User Inserted' };
		}
	}
};

export const getOutstandingBalance = async (center_id: any, limit: any) => {
	let result1: any = await getBalanceByCustomer(center_id, limit);
	let result2: any = await getInvoiceCountByCustomer(center_id, limit);

	for (const r1 of result1) {
		for (const r2 of result2) {
			if (r2.customer_id === r1.id) {
				r1.count = r2._count.id;
				break; // first occurance
			}
		}
	}

	return bigIntToString(result1);
};

export const getBalanceByCustomer = async (center_id: any, limit: any) => {
	let result: any = await prisma.customer.groupBy({
		by: ['name', 'id', 'balance_amt'],

		where: {
			center_id: Number(center_id),
			balance_amt: { not: 0 },
		},
		orderBy: { balance_amt: 'desc' },
	});

	return bigIntToString(result);
};

export const getInvoiceCountByCustomer = async (center_id: any, limit: any) => {
	const result = await prisma.sale.groupBy({
		by: ['customer_id'],
		_count: {
			id: true,
		},

		where: {
			center_id: Number(center_id),
		},
		orderBy: { customer_id: 'asc' },
	});
	return bigIntToString(result);
};

export const updateLogo = async (center_id: any, logo_name: any, logo_url: any, position: any) => {
	if (position === 'main') {
		await updateMainLogo(center_id, logo_name, logo_url);
	} else if (position === 'side') {
		await updateSideLogo(center_id, logo_name, logo_url);
	}
	return 'success';
};

export const updateMainLogo = async (center_id: any, logo_name: any, logo_url: any) => {
	const result = await prisma.center.update({
		where: {
			id: Number(center_id),
		},
		data: {
			logo_name: logo_name,
			logo_url: logo_url,
		},
	});

	return bigIntToString(result);
};

export const updateSideLogo = async (center_id: any, logo_name: any, logo_url: any) => {
	const result = await prisma.center.update({
		where: {
			id: Number(center_id),
		},
		data: {
			side_logo_name: logo_name,
			side_logo_url: logo_url,
		},
	});

	return bigIntToString(result);
};

export const addBank = async (insertValues: any) => {
	let addBank = await insertBank(insertValues);
	if (insertValues.isdefault) {
		let response = await updateCenterBankInfo(insertValues);
	}
	return 'success';
};

export const insertBank = async (insertValues: any) => {
	let today = currentTimeInTimeZone('YYYY-MM-DD HH:mm:ss');
	const result = await prisma.center_banks.create({
		data: {
			center_id: Number(insertValues.center_id),
			bank_name: insertValues.bank_name,
			account_name: insertValues.account_name,
			account_no: insertValues.account_no,
			ifsc_code: insertValues.ifsc_code,
			branch: insertValues.branchdetails,
			is_default: insertValues.is_default === true ? 'Y' : 'N',
		},
	});
	return 'success';
};

export const updateBank = async (insertValues: any) => {
	if (insertValues.isdefault) {
		let updateDefaults = await updateBankDefaults(insertValues.center_id);
	}

	let today = currentTimeInTimeZone('YYYY-MM-DD HH:mm:ss');

	const result = updateBkInfo(insertValues);

	if (insertValues.isdefault) {
		let response = await updateCenterBankInfo(insertValues);
	}

	return 'success';
};

export const updateBkInfo = async (updateValues: any) => {
	let today = currentTimeInTimeZone('YYYY-MM-DD HH:mm:ss');
	let id = updateValues.id;

	let bank_name = updateValues.bank_name;
	let account_name = updateValues.account_name;
	let account_no = updateValues.account_no;
	let ifsc_code = updateValues.ifsc_code;
	let branch = updateValues.branch_details;
	let is_default = updateValues.isdefault === true ? 'Y' : 'N';
	let updated_by = updateValues.updated_by;

	const result = await prisma.center_banks.update({
		where: {
			id: Number(id),
		},
		data: {
			bank_name: bank_name,
			account_name: account_name,
			account_no: account_no,
			ifsc_code: ifsc_code,
			branch: branch,
			is_default: is_default,
			updated_by: updated_by,
		},
	});

	return bigIntToString(result);
};

export const updateCenterBankInfo = async (updateValues: any) => {
	let today = currentTimeInTimeZone('YYYY-MM-DD HH:mm:ss');
	let id = updateValues.center_id;
	let bank_name = `${updateValues.bank_name}, IFSC: ${updateValues.ifsccode}`;
	let account_name = updateValues.account_name;
	let account_no = updateValues.account_no;
	let ifsc_code = updateValues.ifsc;
	let branch = updateValues.branchdetails;

	const result = await prisma.center.update({
		where: {
			id: Number(id),
		},
		data: {
			bank_name: bank_name,
			account_name: account_name,
			account_no: account_no,
			ifsc_code: ifsc_code,
			branch: branch,
		},
	});

	return bigIntToString(result);
};

export const updateBankDefaults = async (updateValues: any) => {
	let today = currentTimeInTimeZone('YYYY-MM-DD HH:mm:ss');
	let center_id = updateValues.center_id;
	let status = updateValues.status;

	const result = await prisma.center_banks.updateMany({
		where: {
			center_id: Number(center_id),
		},
		data: {
			is_default: 'N',
		},
	});

	return bigIntToString(result);
};

module.exports = {
	getOutstandingBalance,
	updateLogo,
	insertBank,
	updateCenterBankInfo,
	updateBank,
	updateBankDefaults,
	//:New
	getProductsCount,
	getProductInfo,
	getStates,
	getTimezones,
	addUser,
	addBank,
};
