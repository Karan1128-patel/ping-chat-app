import Joi from 'joi';
import {
    stringValidation,
    emailValidation,
    numberValidation,
    idArrayValidation,
    dateValidation,
} from '../utils/validator.util.js';


export const updateUserProfileSchema = Joi.object({
    full_name: stringValidation
});
