export interface FormData {
  fullname: string;
  email: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  businessCategory: string;
  resume: File | null;
  businessDocs: File | null;
  tableData: string[][];
  checkboxes: string[];
  contactMethods: string[];
  experience: string;
  filter: string;
}
