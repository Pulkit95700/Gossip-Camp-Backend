import Joi from "joi";

const registerUserValidator = Joi.object({
  enrollmentNo: Joi.string().length(12).required(),
  password: Joi.string().min(8).required(),
  collegeName: Joi.string().required(),
});


export { registerUserValidator };
