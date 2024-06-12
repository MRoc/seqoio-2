const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const UserSchema = new Schema({
  oid: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
  },
  state: {
    type: String,
  },
  roles: [
    {
      type: String,
    },
  ],
  // "email" | "azure-ad" | "google"
  provider: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetTokenExpire: {
    type: Date,
  },
  providerId: {
    type: String,
  },
});

UserSchema.pre("save", async function (next) {
  try {
    if (this.password && (this.isModified("password") || this.isNew)) {
      const salt = await bcrypt.genSalt(13);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const UserStates = {
  CREATING: "creating",
  VERIFY: "verify",
  ACTIVE: "active",
};

const UserRoles = {
  USER: "user",
  ADMIN: "admin",
};

module.exports = {
  UserModel: mongoose.model("User", UserSchema),
  UserStates,
  UserRoles,
  DefaultRoles: [UserRoles.ADMIN],
};
