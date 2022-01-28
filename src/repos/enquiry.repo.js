const { prisma } = require('../config/prisma');

const {
	currentTimeInTimeZone,
	bigIntToString,
	escapeText,
	promisifyQuery,
} = require('../utils/utils');

// let uenqsaleidqry = `update enquiry set
// estatus = 'E',
// sale_id = '${newPK}'
// where
// id =  '${enqref}' `;

const updateEnquiryAfterSale = async (enq_id, saleId, prisma) => {
	const result = await prisma.enquiry.update({
		where: {
			id: Number(enq_id),
		},
		data: {
			e_status: 'E',
			sale_id: Number(saleId),
		},
	});

	return bigIntToString(result);
};

const AddEnquiry = async (customer_id, remarks, center_id, user_id, prisma) => {
	try {
		const result = await prisma.enquiry.create({
			data: {
				center_id: Number(center_id),
				customer_id: Number(customer_id),
				enquiry_date: currentTimeInTimeZone(),
				e_status: 'O',
				remarks: remarks,
				createdAt: currentTimeInTimeZone(),
				created_by: Number(user_id),
			},
		});

		return bigIntToString(result);
	} catch (error) {
		throw new Error(
			`error :: AddEnquiry enquiry.repo.js ..` + error.message
		);
	}
};

module.exports = {
	updateEnquiryAfterSale,
	AddEnquiry,
};
