import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CartStatus, DayOfWeek, OrderStatus } from '@prisma/client';
import { TypedEventEmitter } from '../../../event-emitter/typed-event-emitter.class';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminGateway } from '../../admin/admin.gateway';
import { CartService } from './cart.service';
import { PickupCodeService } from './pickup-code/pickup-code.service';

describe('CartService', () => {
  let service: CartService;

  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    order: {
      create: jest.fn(),
      findFirst: jest.fn()
    },
    businessHours: {
      findFirst: jest.fn()
    },
    businessConfig: {
      findFirst: jest.fn()
    },
    product: {
      findUnique: jest.fn().mockResolvedValue({
        id: '1',
        name: 'Test Product',
        price: 100,
        isAvailable: true
      })
    }
  };

  const mockPickupCodeService = {
    generatePickupCode: jest.fn()
  };

  const mockEventEmitter = {
    emitAsync: jest.fn()
  };

  const mockAdminGateway = {
    sendOrderCreated: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        {
          provide: PickupCodeService,
          useValue: mockPickupCodeService
        },
        {
          provide: TypedEventEmitter,
          useValue: mockEventEmitter
        },
        {
          provide: AdminGateway,
          useValue: mockAdminGateway
        }
      ]
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('completeCart', () => {
    const mockCart = {
      id: '1',
      cartStatus: CartStatus.PENDING,
      cartItems: [
        {
          productId: '1',
          quantity: 1,
          price: 10
        }
      ]
    };

    const mockBusinessHours = {
      dayOfWeek: DayOfWeek.MONDAY,
      openingTime: '09:00',
      closingTime: '23:00',
      isOpen: true
    };

    const mockBusinessConfig = {
      address: 'Test Address'
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.businessHours.findFirst.mockResolvedValue(mockBusinessHours);
      mockPrismaService.businessConfig.findFirst.mockResolvedValue(mockBusinessConfig);
      mockPickupCodeService.generatePickupCode.mockResolvedValue('ABC123');
    });

    describe('Manejo de fecha y hora', () => {
      it('debe preservar el tiempo de UTC al almacenar fechas', async () => {
        // 11:30 AM Peru = 16:30 UTC - dentro del horario de atención
        const peruDate = '2025-03-20T11:30:00';

        const createOrderDto = {
          customerName: 'Test',
          customerLastName: 'User',
          customerEmail: 'test@test.com',
          customerPhone: '123456789',
          someonePickup: false,
          pickupTime: peruDate
        };

        mockPrismaService.order.create.mockImplementation((args) => {
          const savedDate = args.data.pickupTime;
          // Verificamos que se guarde en UTC (16:30)
          expect(savedDate.getUTCHours()).toBe(16);
          return {
            id: '1',
            cartId: '1',
            orderStatus: OrderStatus.PENDING,
            pickupTime: savedDate
          };
        });

        const result = await service.completeCart('1', createOrderDto);
        expect(result.pickupTime.getUTCHours()).toBe(16);
      });

      it('debería mantener la hora cuando se ingresa en hora Perú', async () => {
        // 11:30 Perú = 16:30 UTC
        const peruDate = '2025-03-06T11:30:00';

        const createOrderDto = {
          customerName: 'Test',
          customerLastName: 'User',
          customerEmail: 'test@test.com',
          customerPhone: '123456789',
          someonePickup: false,
          pickupTime: peruDate
        };

        mockPrismaService.order.create.mockImplementation((args) => {
          const savedDate = args.data.pickupTime;
          expect(savedDate.getUTCHours()).toBe(16); // 11:30 Perú = 16:30 UTC
          return {
            id: '1',
            cartId: '1',
            orderStatus: OrderStatus.PENDING,
            pickupTime: savedDate
          };
        });

        const result = await service.completeCart('1', createOrderDto);
        expect(result.pickupTime.getUTCHours()).toBe(16); // Verificamos UTC
      });
    });

    describe('Validación del horario comercial', () => {
      it('debe rechazar las órdenes antes del horario de apertura (9:00 am Perú)', async () => {
        // 8:30 AM Peru = 13:30 UTC
        const earlyDate = '2025-03-02T08:30:00'; // Antes de abrir

        const createOrderDto = {
          customerName: 'Test',
          customerLastName: 'User',
          customerEmail: 'test@test.com',
          customerPhone: '123456789',
          someonePickup: false,
          pickupTime: earlyDate
        };

        await expect(service.completeCart('1', createOrderDto)).rejects.toThrow(
          'Pickup date cannot be in the past.'
        );
      });

      it('Debe rechazar pedidos después del horario comercial (11:00 p.m. Perú)', async () => {
        // 23:30 PM Peru = 04:30 UTC siguiente día
        const lateDate = '2025-03-02T23:30:00'; // Después de cerrar

        const createOrderDto = {
          customerName: 'Test',
          customerLastName: 'User',
          customerEmail: 'test@test.com',
          customerPhone: '123456789',
          someonePickup: false,
          pickupTime: lateDate
        };

        await expect(service.completeCart('1', createOrderDto)).rejects.toThrow(
          'Pickup date cannot be in the past.'
        );
      });

      it('Debería rechazar pedidos si es una time pasada a la hora actual, siempre y cuando sea el dia actual el pedido', async () => {
        // Set current date to a fixed time
        const now = new Date('2025-02-18T16:00:00.000Z');
        jest.useFakeTimers();
        jest.setSystemTime(now);

        // Set order time to 1 hour before current time
        const pastTime = '2025-02-18T15:00:00.000Z';

        const createOrderDto = {
          customerName: 'Test',
          customerLastName: 'User',
          customerEmail: 'test@test.com',
          customerPhone: '123456789',
          someonePickup: false,
          pickupTime: pastTime
        };

        await expect(service.completeCart('1', createOrderDto)).rejects.toThrow(
          new BadRequestException(
            `Orders must be placed at least 30 minutes in advance. Current time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}, earliest available: ${new Date(now.getTime() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
          )
        );

        jest.useRealTimers();
      });
    });
  });
});
