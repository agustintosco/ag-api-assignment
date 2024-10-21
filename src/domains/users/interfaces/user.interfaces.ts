import { User } from '../models/user.model';

export class UserList {
  users: User[];
  hasNextPage: boolean;
}
