const errorsCode = {
    'objectDoesNotExist': 404, //404: Not Found
    'objectConflict': 409, // 409: Conflict
    'badRequest': 400, // 400: Bad Request
    'objectContainerDoesNotExist': 422, // 422: Unprocessable Entity.
}

const successCode = {
    'objectDeleted': 204, //204: No Content
    'objectCreated': 201, //201: Created
    'ok': 200, //200: OK

    
}

module.exports.errorsCode = errorsCode;
module.exports.successCode = successCode;