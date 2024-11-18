<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Installation

```bash
$ yarn
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

<p>Lưu ý: Cần đổi DB_AUTO_DROP_SCHEMA trong .env thành true trước khi chạy test</p>
<p>Lưu ý: Test E2E cần dùng import 'src/utils/safeExecutionExtensions' để chạy toSafe</p>
<p>Lưu ý: Unit test cần tạo 1 function và chạy nó trên cùng tất cả import để chạy toSafe (vi dụ trong file auth.service.spec.ts)</p>

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Migrations
```bash
# tạo file migrate vào trong root/db/migrations
$ npm run migration:generate --name=<migrations file name>

# thực thi những file migrations chưa sử dụng
$ yarn migration:run
```

## Import
```bash
# Quy tắc import
$ Chỉ được dùng import tuyệt đối
```
## Email

Vào link này để lấy app pass google, MAIL_USER là email đăng nhập, còn MAIL_PASSWORD là pass lấy ở link dưới
<a>https://myaccount.google.com/apppasswords</p>
