export interface VendorDTO {
	id?: number;
	center_id: number;

	vendor_name: string;
	address1: string;
	address2: string;
	address3: string;
	district: string;
	state_id: number;
	pin: string;
	gst: string;
	phone: string;
	mobile: string;
	mobile2: string;
	whatsapp: string;
	email: string;
	is_active: string;
	credit_amt: number;
	balance_amt: number;
	last_paid_date: Date;

	createdAt?: Date;
	updatedAt?: Date;
	created_by?: number;
	updated_by?: number;
}