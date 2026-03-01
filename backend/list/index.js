"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import session from "cookie-session";
const app_config_1 = require("./config/app.config");
const database_config_1 = __importDefault(require("./config/database.config"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const http_config_1 = require("./config/http.config");
const asyncHandler_middleware_1 = require("./middlewares/asyncHandler.middleware");
const appError_1 = require("./utils/appError");
const error_code_enum_1 = require("./enums/error-code.enum");
require("./config/passport.config");
const passport_1 = __importDefault(require("passport"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const workspace_route_1 = __importDefault(require("./routes/workspace.route"));
const member_route_1 = __importDefault(require("./routes/member.route"));
const project_route_1 = __importDefault(require("./routes/project.route"));
const task_route_1 = __importDefault(require("./routes/task.route"));
const passport_config_1 = require("./config/passport.config");
const app = (0, express_1.default)();
const BASE_PATH = app_config_1.config.BASE_PATH;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// app.use(
//   session({
//     name: "session",
//     keys: [config.SESSION_SECRET],
//     maxAge: 24 * 60 * 60 * 1000,
//     secure: config.NODE_ENV === "production",
//     httpOnly: true,
//     sameSite: "lax",
//   })
// );
app.use(passport_1.default.initialize());
// app.use(passport.session());
app.use((0, cors_1.default)({
    origin: app_config_1.config.FRONTEND_ORIGIN,
    credentials: true,
}));
app.get(`/`, (0, asyncHandler_middleware_1.asyncHandler)(async (req, res, next) => {
    throw new appError_1.BadRequestException("This is a bad request", error_code_enum_1.ErrorCodeEnum.AUTH_INVALID_TOKEN);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Hello Subscribe to the channel & share",
    });
}));
app.use(`${BASE_PATH}/auth`, auth_route_1.default);
app.use(`${BASE_PATH}/user`, passport_config_1.passportAuthenticateJWT, user_route_1.default);
app.use(`${BASE_PATH}/workspace`, passport_config_1.passportAuthenticateJWT, workspace_route_1.default);
app.use(`${BASE_PATH}/member`, passport_config_1.passportAuthenticateJWT, member_route_1.default);
app.use(`${BASE_PATH}/project`, passport_config_1.passportAuthenticateJWT, project_route_1.default);
app.use(`${BASE_PATH}/task`, passport_config_1.passportAuthenticateJWT, task_route_1.default);
app.use(errorHandler_middleware_1.errorHandler);
app.listen(app_config_1.config.PORT, async () => {
    console.log(`Server listening on port ${app_config_1.config.PORT} in ${app_config_1.config.NODE_ENV}`);
    await (0, database_config_1.default)();
});
