"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LoansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const loan_entity_1 = require("./entities/loan.entity");
const outbox_event_entity_1 = require("./entities/outbox-event.entity");
let LoansService = LoansService_1 = class LoansService {
    constructor(loanRepository, outboxRepository) {
        this.loanRepository = loanRepository;
        this.outboxRepository = outboxRepository;
        this.logger = new common_1.Logger(LoansService_1.name);
    }
    async create(dto, status = 'active') {
        this.logger.log(`📝 Creando préstamo - Libro: ${dto.bookId}, Usuario: ${dto.userName}`);
        const loan = this.loanRepository.create({
            bookId: dto.bookId,
            userId: dto.userId,
            userName: dto.userName,
            status,
            returnDate: null,
            failureReason: null,
        });
        const savedLoan = await this.loanRepository.save(loan);
        this.logger.log(`✅ Préstamo creado: ${savedLoan.id} (status: ${status})`);
        return savedLoan;
    }
    async createPending(dto) {
        return this.create(dto, 'pending');
    }
    async findAll() {
        return this.loanRepository.find({
            order: { loanDate: 'DESC' },
        });
    }
    async findActive() {
        return this.loanRepository.find({
            where: { status: 'active' },
            order: { loanDate: 'DESC' },
        });
    }
    async findPending() {
        return this.loanRepository.find({
            where: { status: 'pending' },
            order: { loanDate: 'DESC' },
        });
    }
    async findOne(id) {
        return this.loanRepository.findOne({ where: { id } });
    }
    async updateStatus(id, status, failureReason) {
        const loan = await this.findOne(id);
        if (!loan) {
            this.logger.warn(`⚠️ Préstamo no encontrado: ${id}`);
            return null;
        }
        loan.status = status;
        if (failureReason) {
            loan.failureReason = failureReason;
        }
        if (status === 'returned') {
            loan.returnDate = new Date();
        }
        const updated = await this.loanRepository.save(loan);
        this.logger.log(`📝 Préstamo ${id} actualizado a ${status}`);
        return updated;
    }
    async confirmLoan(id) {
        return this.updateStatus(id, 'active');
    }
    async rejectLoan(id, reason) {
        return this.updateStatus(id, 'failed', reason);
    }
    async returnLoan(id) {
        return this.updateStatus(id, 'returned');
    }
    async saveOutboxEvent(eventType, payload) {
        this.logger.log(`🟢 [OUTBOX] Guardando evento: ${eventType}`);
        const event = this.outboxRepository.create({
            eventType,
            payload: JSON.stringify(payload),
            processed: false,
            retryCount: 0,
        });
        return this.outboxRepository.save(event);
    }
    async getPendingOutboxEvents(maxRetries = 5) {
        return this.outboxRepository.find({
            where: { processed: false },
            order: { createdAt: 'ASC' },
        });
    }
    async markEventProcessed(eventId) {
        await this.outboxRepository.update(eventId, {
            processed: true,
            processedAt: new Date(),
        });
        this.logger.log(`🟢 [OUTBOX] Evento ${eventId} marcado como procesado`);
    }
    async incrementRetryCount(eventId, error) {
        const event = await this.outboxRepository.findOne({ where: { id: eventId } });
        if (event) {
            event.retryCount += 1;
            event.lastError = error;
            await this.outboxRepository.save(event);
            this.logger.log(`🟢 [OUTBOX] Evento ${eventId} - Reintento ${event.retryCount}`);
        }
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = LoansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __param(1, (0, typeorm_1.InjectRepository)(outbox_event_entity_1.OutboxEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LoansService);
//# sourceMappingURL=loans.service.js.map