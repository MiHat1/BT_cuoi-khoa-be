export class HttpResponse {
    constructor(res) {
        this.res = res;
    }

    success(data = null, message = 'Operation successful') {
        return this.res.status(200).json({
            success: true,
            data,
            message
        });
    }

    created(data = null, message = 'Created successfully') {
        return this.res.status(201).json({
            success: true,
            data,
            message
        });
    }
}
