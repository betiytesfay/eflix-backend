import {isNonEmptyString, isOptionalString} from 'jet-validators';
import {testObject} from 'jet-validators/utils';

export const isUserRegistration = testObject({
    username : isOptionalString,
    email: isOptionalString,
    password: isNonEmptyString,
    phoneNumber : isNonEmptyString,
    telegramAccount: isOptionalString,

});

export const isUserLogin = testObject({
 phoneNumber: isNonEmptyString,
 email:isOptionalString,
 password: isNonEmptyString
});