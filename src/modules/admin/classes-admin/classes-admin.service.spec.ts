import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassStatus, MethodPayment, TypeClass, TypeCurrency } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { ClassClosed, ClassesDataAdmin } from '../../../interfaces';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClassesAdminService } from './classes-admin.service';
import { CreateClassAdminDto } from './dto/create-class-admin.dto';

// Mock de módulos externos
jest.mock('fs');
jest.mock('path');
jest.mock('puppeteer', () => ({
  launch: jest.fn()
}));

describe('ClassesAdminService', () => {
  let service: ClassesAdminService;

  // Mock de PrismaService
  const mockPrismaService = {
    $transaction: jest.fn(),
    classes: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    classCapacity: {
      findFirst: jest.fn()
    },
    classRegister: {
      create: jest.fn()
    },
    businessConfig: {
      findFirst: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesAdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile();

    service = module.get<ClassesAdminService>(ClassesAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createClass', () => {
    const mockCreateClassDto: CreateClassAdminDto = {
      typeClass: TypeClass.NORMAL,
      userName: 'Juan Pérez',
      userEmail: 'juan@example.com',
      userPhone: '123456789',
      totalAdults: 1,
      totalChildren: 1,
      totalParticipants: 2,
      totalPrice: 150,
      totalPriceAdults: 100,
      totalPriceChildren: 50,
      languageClass: 'español',
      dateClass: '2025-02-20',
      scheduleClass: '10:00 AM',
      typeCurrency: TypeCurrency.PEN,
      methodPayment: MethodPayment.IZIPAY,
      expiresAt: new Date()
    };

    const mockClassCapacity = {
      minCapacity: 2,
      maxCapacity: 10
    };

    it('debería crear una nueva clase cuando no existe una para la fecha y horario dados', async () => {
      // Mock de respuestas
      mockPrismaService.classes.findFirst.mockResolvedValue(null);
      mockPrismaService.classCapacity.findFirst.mockResolvedValue(mockClassCapacity);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      const mockCreatedClass = {
        id: '1',
        totalParticipants: 0,
        ...mockCreateClassDto
      };

      const mockClassRegister = {
        id: '1',
        classesId: '1',
        totalParticipants: 3,
        ...mockCreateClassDto
      };

      mockPrismaService.classes.create.mockResolvedValue(mockCreatedClass);
      mockPrismaService.classRegister.create.mockResolvedValue(mockClassRegister);
      mockPrismaService.classes.update.mockResolvedValue({
        ...mockCreatedClass,
        totalParticipants: 3
      });

      const result = await service.createClass(mockCreateClassDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.classes.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.classes.create).toHaveBeenCalled();
      expect(mockPrismaService.classRegister.create).toHaveBeenCalled();
      expect(mockPrismaService.classes.update).toHaveBeenCalled();
    });

    it('debería lanzar una excepción si la clase está cerrada', async () => {
      // Mock de una clase cerrada
      mockPrismaService.classes.findFirst.mockResolvedValue({
        id: '1',
        dateClass: new Date('2025-02-20'),
        scheduleClass: '10:00 AM',
        isClosed: true,
        typeClass: TypeClass.NORMAL,
        totalParticipants: 0
      });

      // Mock de capacidad para asegurar que no es ese el problema
      mockPrismaService.classCapacity.findFirst.mockResolvedValue(mockClassCapacity);

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await expect(service.createClass(mockCreateClassDto)).rejects.toThrow(
        new BadRequestException('La clase ya se encuentra cerrada')
      );
    });

    it('debería lanzar una excepción si la capacidad mínima no se alcanza', async () => {
      mockPrismaService.classes.findFirst.mockResolvedValue({
        id: '1',
        isClosed: false,
        totalParticipants: 2
      });

      mockPrismaService.classCapacity.findFirst.mockResolvedValue({
        minCapacity: 5,
        maxCapacity: 10
      });

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await expect(service.createClass(mockCreateClassDto)).rejects.toThrow(
        new BadRequestException('La capacidad de la clase tiene que ser mayor a mínimo')
      );
    });

    it('debería lanzar una excepción si se excede la capacidad máxima', async () => {
      mockPrismaService.classes.findFirst.mockResolvedValue({
        id: '1',
        isClosed: false,
        totalParticipants: 9
      });

      mockPrismaService.classCapacity.findFirst.mockResolvedValue({
        minCapacity: 2,
        maxCapacity: 10
      });

      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await expect(service.createClass(mockCreateClassDto)).rejects.toThrow(
        new BadRequestException('La capacidad de la clase ha sido excedida')
      );
    });
  });

  describe('findByDate', () => {
    const mockClassesData: ClassesDataAdmin[] = [
      {
        totalParticipants: 3,
        languageClass: 'español',
        dateClass: new Date('2025-02-20'),
        scheduleClass: '10:00 AM',
        typeClass: TypeClass.NORMAL,
        isClosed: false,
        registers: [
          {
            id: '1',
            userName: 'Juan Pérez',
            userEmail: 'juan@example.com',
            userPhone: '123456789',
            totalParticipants: 3,
            totalAdults: 2,
            totalChildren: 1,
            totalPrice: 150,
            totalPriceAdults: 100,
            totalPriceChildren: 50,
            typeCurrency: TypeCurrency.PEN,
            comments: '',
            status: ClassStatus.CONFIRMED
          }
        ]
      }
    ];

    it('debería retornar las clases para una fecha dada', async () => {
      const mockDate = '2025-02-20';
      const mockClasses = [
        {
          id: '1',
          totalParticipants: 3,
          languageClass: 'español',
          dateClass: new Date(mockDate),
          scheduleClass: '10:00 AM',
          typeClass: TypeClass.NORMAL,
          isClosed: false,
          ClassRegister: mockClassesData[0].registers
        }
      ];

      mockPrismaService.classes.findMany.mockResolvedValue(mockClasses);

      const result = await service.findByDate(mockDate);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].registers).toHaveLength(1);
      expect(result[0].registers[0].userName).toBe('Juan Pérez');
    });
  });

  describe('closeClass', () => {
    const mockClosedClass: ClassClosed = {
      dateClass: new Date(),
      scheduleClass: '10:00 AM'
    };

    it('debería alternar el estado de cierre de una clase', async () => {
      const classId = '1';
      const mockClass = {
        ...mockClosedClass,
        id: classId,
        isClosed: false
      };

      mockPrismaService.classes.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.classes.update.mockResolvedValue({
        ...mockClass,
        isClosed: true
      });

      const result = await service.closeClass(classId);

      expect(result).toBeDefined();
      expect(mockPrismaService.classes.update).toHaveBeenCalledWith({
        where: { id: classId },
        data: { isClosed: true },
        select: {
          id: true,
          dateClass: true,
          scheduleClass: true,
          isClosed: true
        }
      });
    });

    it('debería lanzar una excepción si la clase no existe', async () => {
      mockPrismaService.classes.findUnique.mockResolvedValue(null);

      await expect(service.closeClass('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkClassExists', () => {
    it('debería retornar el ID de la clase si existe', async () => {
      const mockDate = new Date();
      const mockSchedule = '10:00 AM';
      const mockClass = {
        id: '1'
      };

      mockPrismaService.classes.findFirst.mockResolvedValue(mockClass);

      const result = await service.checkClassExists(mockDate, mockSchedule);

      expect(result).toBe('1');
      expect(mockPrismaService.classes.findFirst).toHaveBeenCalledWith({
        where: {
          dateClass: mockDate,
          scheduleClass: mockSchedule
        }
      });
    });

    it('debería retornar undefined si la clase no existe', async () => {
      mockPrismaService.classes.findFirst.mockResolvedValue(null);

      const result = await service.checkClassExists(new Date(), '10:00 AM');

      expect(result).toBeUndefined();
    });
  });

  describe('findAllFutureClasses', () => {
    const mockFutureClasses = [
      {
        id: '1',
        dateClass: new Date('2025-02-25'),
        scheduleClass: '10:00 AM',
        isClosed: false,
        totalParticipants: 5
      },
      {
        id: '2',
        dateClass: new Date('2025-02-26'),
        scheduleClass: '14:00 PM',
        isClosed: true,
        totalParticipants: 10
      }
    ];

    it('debería retornar todas las clases futuras', async () => {
      mockPrismaService.classes.findMany.mockResolvedValue(mockFutureClasses);

      const result = await service.findAllFutureClasses();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(mockPrismaService.classes.findMany).toHaveBeenCalledWith({
        where: {
          scheduleClass: undefined,
          typeClass: 'NORMAL',
          dateClass: {
            gte: expect.any(Date)
          }
        },
        select: {
          id: true,
          dateClass: true,
          scheduleClass: true,
          isClosed: true,
          totalParticipants: true
        }
      });
    });

    it('debería filtrar por horario específico', async () => {
      const scheduleClass = '10:00 AM';
      const filteredClasses = mockFutureClasses.filter((c) => c.scheduleClass === scheduleClass);
      mockPrismaService.classes.findMany.mockResolvedValue(filteredClasses);

      const result = await service.findAllFutureClasses(scheduleClass);

      expect(result).toHaveLength(1);
      expect(result[0].scheduleClass).toBe(scheduleClass);
      expect(mockPrismaService.classes.findMany).toHaveBeenCalledWith({
        where: {
          scheduleClass,
          typeClass: 'NORMAL',
          dateClass: {
            gte: expect.any(Date)
          }
        },
        select: {
          id: true,
          dateClass: true,
          scheduleClass: true,
          isClosed: true,
          totalParticipants: true
        }
      });
    });

    it('debería filtrar por tipo de clase', async () => {
      const typeClass = TypeClass.PRIVATE;
      mockPrismaService.classes.findMany.mockResolvedValue([mockFutureClasses[0]]);

      const result = await service.findAllFutureClasses(undefined, typeClass);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.classes.findMany).toHaveBeenCalledWith({
        where: {
          scheduleClass: undefined,
          typeClass,
          dateClass: {
            gte: expect.any(Date)
          }
        },
        select: {
          id: true,
          dateClass: true,
          scheduleClass: true,
          isClosed: true,
          totalParticipants: true
        }
      });
    });
  });

  describe('checkClass', () => {
    const mockSchedule = '10:00 AM';
    const mockDate = '2025-02-25';
    const mockType = TypeClass.NORMAL;

    it('debería retornar los detalles de la clase si existe', async () => {
      const mockClass = {
        id: '1',
        languageClass: 'español',
        dateClass: new Date(mockDate),
        scheduleClass: mockSchedule,
        typeClass: mockType,
        isClosed: false,
        totalParticipants: 5
      };

      mockPrismaService.classes.findFirst.mockResolvedValue(mockClass);

      const result = await service.checkClass(mockSchedule, mockDate, mockType);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockPrismaService.classes.findFirst).toHaveBeenCalledWith({
        where: {
          dateClass: expect.any(Date),
          scheduleClass: mockSchedule,
          typeClass: mockType
        },
        select: {
          id: true,
          languageClass: true,
          dateClass: true,
          scheduleClass: true,
          typeClass: true,
          isClosed: true,
          totalParticipants: true
        }
      });
    });

    it('debería manejar fechas inválidas', async () => {
      await expect(service.checkClass(mockSchedule, 'fecha-invalida', mockType)).rejects.toThrow(
        BadRequestException
      );
    });

    it('debería retornar null si la clase no existe', async () => {
      mockPrismaService.classes.findFirst.mockResolvedValue(null);

      const result = await service.checkClass(mockSchedule, mockDate, mockType);

      expect(result).toBeNull();
    });

    it('debería manejar errores de base de datos', async () => {
      mockPrismaService.classes.findFirst.mockRejectedValue(new Error('DB Error'));

      await expect(service.checkClass(mockSchedule, mockDate, mockType)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('generateExcelClasssesAdmin', () => {
    // Mock de ExcelJS
    const mockWorksheet = {
      columns: [],
      addRow: jest.fn(),
      getCell: jest.fn().mockReturnValue({ value: null })
    };

    const mockWorkbook = {
      addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data'))
      }
    };

    // Datos de prueba
    const mockClassesData: ClassesDataAdmin[] = [
      {
        totalParticipants: 3,
        languageClass: 'español',
        dateClass: new Date('2025-02-20'),
        scheduleClass: '10:00 AM',
        typeClass: TypeClass.NORMAL,
        isClosed: false,
        registers: [
          {
            id: '1',
            userName: 'Juan Pérez',
            userEmail: 'juan@example.com',
            userPhone: '123456789',
            totalParticipants: 2,
            totalAdults: 1,
            totalChildren: 1,
            totalPrice: 100,
            totalPriceAdults: 60,
            totalPriceChildren: 40,
            typeCurrency: TypeCurrency.PEN,
            comments: '',
            status: ClassStatus.CONFIRMED
          }
        ]
      }
    ];

    beforeEach(() => {
      // Mock del constructor de Workbook
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook as any);
      mockWorksheet.addRow.mockClear();
      mockWorksheet.getCell.mockClear();
    });

    it('debería generar un archivo Excel con los datos correctos', async () => {
      const result = await service.generateExcelClasssesAdmin(mockClassesData);

      expect(result).toBeDefined();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Registro de Clases');

      // Verificar configuración de columnas
      expect(mockWorksheet.columns).toBeDefined();
      expect(mockWorksheet.addRow).toHaveBeenCalled();

      // Verificar que se limpió la primera fila
      expect(mockWorksheet.getCell).toHaveBeenCalled();

      // Verificar que se generó el buffer
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debería configurar las columnas correctamente', async () => {
      await service.generateExcelClasssesAdmin(mockClassesData);

      const expectedColumns = [
        { header: 'Nombre de Usuario', key: 'userName', width: 20 },
        { header: 'Email de Usuario', key: 'userEmail', width: 30 },
        { header: 'Teléfono de Usuario', key: 'userPhone', width: 20 },
        { header: 'Total Adultos', key: 'totalAdults', width: 12 },
        { header: 'Total Niños', key: 'totalChildren', width: 12 },
        { header: 'Total Participantes', key: 'totalParticipants', width: 18 },
        { header: 'Precio Adultos', key: 'totalPriceAdults', width: 15 },
        { header: 'Precio Niños', key: 'totalPriceChildren', width: 15 },
        { header: 'Precio Total', key: 'totalPrice', width: 12 }
      ];

      expect(mockWorksheet.columns).toEqual(expectedColumns);
    });

    it('debería manejar el caso de datos vacíos', async () => {
      const result = await service.generateExcelClasssesAdmin([]);

      expect(result).toBeDefined();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });
  });

  describe('generatePDFClassReport', () => {
    const mockTemplateHtml = '<html>{{bussiness}}{{classess}}{{dateReport}}{{footerReport}}</html>';
    const mockPage = {
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-data'))
    };
    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn()
    };

    beforeEach(() => {
      // Mock de fs.readFileSync
      (fs.readFileSync as jest.Mock).mockReturnValue(mockTemplateHtml);

      // Mock de path.join
      (path.join as jest.Mock).mockReturnValue('/mock/path/to/template.html');

      // Mock de puppeteer.launch
      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

      // Mock de businessConfig
      mockPrismaService.businessConfig.findFirst.mockResolvedValue({
        businessName: 'Test Business'
      });
    });

    it('debería generar un PDF con los datos de las clases', async () => {
      const mockData: ClassesDataAdmin[] = [
        {
          totalParticipants: 3,
          languageClass: 'español',
          dateClass: new Date('2025-02-20'),
          scheduleClass: '10:00 AM',
          typeClass: TypeClass.NORMAL,
          isClosed: false,
          registers: [
            {
              id: '1',
              userName: 'Juan Pérez',
              userEmail: 'juan@example.com',
              userPhone: '123456789',
              totalParticipants: 2,
              totalAdults: 1,
              totalChildren: 1,
              totalPrice: 100,
              totalPriceAdults: 60,
              totalPriceChildren: 40,
              typeCurrency: TypeCurrency.PEN,
              comments: '',
              status: ClassStatus.CONFIRMED
            }
          ]
        }
      ];

      const result = await service.generatePDFClassReport(mockData);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(fs.readFileSync).toHaveBeenCalledWith('/mock/path/to/template.html', 'utf8');
      expect(puppeteer.launch).toHaveBeenCalledWith({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalledWith({ format: 'A4' });
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('debería manejar errores al leer la plantilla HTML', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Error al leer archivo');
      });

      await expect(service.generatePDFClassReport([])).rejects.toThrow();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('debería manejar errores al generar el PDF', async () => {
      mockPage.pdf.mockRejectedValue(new Error('Error al generar PDF'));

      await expect(service.generatePDFClassReport([])).rejects.toThrow();
    });
  });
});
