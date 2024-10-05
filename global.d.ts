declare global {
    /**
     * Mở rộng interface của Promise để thêm phương thức toSafe
     */
    interface Promise<T> {
        /**
         * Xử lý ngoại lệ cho Promise mà không dùng try catch.
         *
         * Đầu ra là 1 mảng gồm 2 phần tử: error và result với index tương ứng.
         *
         * Do unknown bao gồm cả null nên:
         *  - Nếu result là truthy thì error sẽ là null.
         *  - Nhưng nếu error là truthy thì chưa chắc result sẽ là null.
         *  - => !result thì error sẽ là truthy.
         */
        toSafe(): Promise<[unknown, null] | [null, T]>;
    }

    /**
     * Mở rộng interface của Function để thêm phương thức toSafe
     */
    interface Function {
        /**
         * Xử lý ngoại lệ cho Function không có try catch.
         *
         * Đầu ra là 1 mảng gồm 2 phần tử: error và result với index tương ứng.
         *
         * Do unknown bao gồm cả null nên:
         *  - Nếu result là truthy thì error sẽ là null.
         *  - Nhưng nếu error là truthy thì chưa chắc result sẽ là null.
         *  - => !result thì error sẽ là truthy.
         *
         * Với trường hợp hàm phụ thuộc vào context (bên trong hàm có this) thì cần bind context vào hàm:
         *  - const [error, result] = verify.toSafe(token);
         *  - const [error, result] = this.jwtService.verify.bind(this.jwtService).toSafe(token);
         */
        toSafe<T = typeof this>(...args: unknown[]): [unknown, null] | [null, T];
    }
}

export { };

