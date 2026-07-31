import { Request, Response, Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

const docsContentSecurityPolicy = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
  },
});

const docsRouter = Router();

docsRouter.get("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  return res.send(openApiDocument);
});

docsRouter.use(
  docsContentSecurityPolicy,
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "TaskFlow API docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "none",
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

export default docsRouter;
export { openApiDocument };
