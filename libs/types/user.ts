export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserInput = Pick<User, "email" | "name">;
export type UpdateUserInput = Partial<Pick<User, "name">>;
