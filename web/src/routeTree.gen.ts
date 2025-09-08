import { Route as rootRoute } from "./routes/__root";
import { Route as indexRoute } from "./routes/index";
import {
  Route as customersRoute,
  CustomerDetailRoute as customerDetailRoute,
} from "./routes/customers";
import { Route as transactionsRoute } from "./routes/transactions";
import { Route as transactionDetailRoute } from "./routes/transactions.$transactionId";
import { Route as paymentsRoute } from "./routes/payments";
import { Route as authLoginRoute } from "./routes/auth.login";
import { Route as authSignupRoute } from "./routes/auth.signup";

export const routeTree = rootRoute.addChildren({
  indexRoute,
  customersRoute,
  customerDetailRoute,
  transactionsRoute,
  transactionDetailRoute,
  paymentsRoute,
  authLoginRoute,
  authSignupRoute,
});
