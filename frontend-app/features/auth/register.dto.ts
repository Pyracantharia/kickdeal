export type RegisterDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles?: string[];
}