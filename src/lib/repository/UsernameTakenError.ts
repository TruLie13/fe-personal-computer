export class UsernameTakenError extends Error {
  constructor(message = "That username is already taken.") {
    super(message);
    this.name = "UsernameTakenError";
  }
}
