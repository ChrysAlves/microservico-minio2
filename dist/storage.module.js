"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const s3_module_1 = require("./infra/s3/s3.module");
const storage_controller_1 = require("./infra/controllers/storage.controller");
const upload_use_case_1 = require("./domain/storage/use-cases/upload.use-case");
const generar_url_use_case_1 = require("./domain/storage/use-cases/generar-url.use-case");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Module)({
        imports: [s3_module_1.S3Module],
        controllers: [storage_controller_1.StorageController],
        providers: [
            upload_use_case_1.UploadUseCase,
            generar_url_use_case_1.GerarUrlUseCase
        ],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map