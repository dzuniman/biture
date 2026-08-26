# Quote2Cash PHP API

The API is a PHP front controller at `index.php` with explicit controllers and services under `src`, and keeps the existing frontend REST contract under `/api`.

## Local development

Requirements: PHP 8.2+ with `pdo_mysql`, `fileinfo`, `zip`, `xml`, and `openssl` enabled. Install dependencies with `composer install` from the `api` folder. The repository includes `api/php.ini` for the Windows PHP distribution used by local development.

```powershell
php -c api/php.ini -S localhost:5227 -t api api/index.php
```

If PHP is installed elsewhere, update `extension_dir` in `api/php.ini` to that installation's `ext` directory. Without `pdo_mysql`, PHP reports `could not find driver` before the API can initialize its database.

Uploaded files are stored in `DATA_DIR`. The initial accounts are `admin` / `adminpass` and `user` / `userpass`; change these before production use.

Set `DATABASE_URL` to your MySQL connection, for example `mysql://root:password@localhost:3306/erp_biture?charset=utf8mb4`. Set `DATA_DIR` to move upload storage, and `JWT_KEY` to replace the development signing key.

## Login

The login endpoint is:

```http
POST http://localhost:5227/api/auth/login
Content-Type: application/json

{"username":"admin","password":"adminpass"}
```

It returns a JWT token. Send that token on protected requests:

```http
Authorization: Bearer <token>
```

The default accounts are `admin` / `adminpass` and `user` / `userpass`.

## Endpoints

`GET /api/health` is public. `POST /api/auth/login` is public. Product lookup by code (`GET /api/products/by-code/{code}`) is also public. All other endpoints require the bearer token; creating, editing, or deleting clients, users, products, and product tools requires an Admin token.

| Resource | List | Get one | Create | Update | Delete |
| --- | --- | --- | --- | --- | --- |
| Clients | `GET /api/clients` | `GET /api/clients/{id}` | `POST /api/clients` | `PUT /api/clients/{id}` | `DELETE /api/clients/{id}` |
| Products | `GET /api/products` | `GET /api/products/{id}` | `POST /api/products` | `PUT /api/products/{id}` | `DELETE /api/products/{id}` |
| Quote UOMs | `GET /api/quoteuoms` | `GET /api/quoteuoms/{id}` | `POST /api/quoteuoms` | `PUT /api/quoteuoms/{id}` | `DELETE /api/quoteuoms/{id}` |
| Users | `GET /api/users` | `GET /api/users/{id}` | `POST /api/users` | `PUT /api/users/{id}` | `DELETE /api/users/{id}` |
| Quotes | `GET /api/quotes` | `GET /api/quotes/{id}` | `POST /api/quotes` | `PUT /api/quotes/{id}` | `DELETE /api/quotes/{id}` |
| Invoices | `GET /api/invoices` | `GET /api/invoices/{id}` | `POST /api/invoices` | `PUT /api/invoices/{id}` | `DELETE /api/invoices/{id}` |
| Job cards | `GET /api/jobcards` | `GET /api/jobcards/{id}` | `POST /api/jobcards` | `PUT /api/jobcards/{id}` | `DELETE /api/jobcards/{id}` |
| Delivery notes | `GET /api/deliverynotes` | `GET /api/deliverynotes/{id}` | `POST /api/deliverynotes` | `PUT /api/deliverynotes/{id}` | `DELETE /api/deliverynotes/{id}` |
| Credit notes | `GET /api/creditnotes` | `GET /api/creditnotes/{id}` | `POST /api/creditnotes` | `PUT /api/creditnotes/{id}` | `DELETE /api/creditnotes/{id}` |
| Costs | `GET /api/costs` | `GET /api/costs/{id}` | `POST /api/costs` | `PUT /api/costs/{id}` | `DELETE /api/costs/{id}` |
| Statements | `GET /api/statements` | `GET /api/statements/{id}` | `POST /api/statements` | `PUT /api/statements/{id}` | `DELETE /api/statements/{id}` |
| Tools | `GET /api/tools` | `GET /api/tools/{id}` | `POST /api/tools` | `PUT /api/tools/{id}` | `DELETE /api/tools/{id}` |
| Documents | `GET /api/documents` | `GET /api/documents/{id}` | `POST /api/documents` | `PUT /api/documents/{id}` | `DELETE /api/documents/{id}` |

Additional routes:

- `GET /api/{quotes|invoices|statements|jobcards|deliverynotes|creditnotes}/nextNumber` or `/next-number`
- `GET /api/products/by-code/{code}` and `GET /api/products/search?query=term`
- `GET /api/products/template`
- `POST /api/products/upload-image`, `POST /api/products/upload-excel`
- `POST /api/tools/upload-image` and `POST /api/tools/upload-manual`
- `POST /api/quotes/items/images/upload`
- `GET /api/products/images/{file}`, `GET /api/tools/images/{file}`, `GET /api/quotes/items/images/{file}`
- `POST /api/documents` with multipart field `file` and `documentName`; `GET /api/documents/{id}/download`

Use JSON request bodies for normal create/update calls. Quote, cost, and statement bodies may include an `items` array.

## Deployment

The root `Dockerfile` runs PHP 8.2 on port `10000`, and `render.yaml` is configured for the container deployment. Configure `DATABASE_URL` and persistent storage for `DATA_DIR` in production so MySQL data access and uploads remain available.
