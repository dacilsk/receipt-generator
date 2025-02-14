declare module 'react-native-bluetooth-escpos-printer' {
  import {EmitterSubscription} from 'react-native';

  export interface BluetoothDevice {
    name: string;
    address: string;
  }

  export interface ScanResult {
    paired: BluetoothDevice[];
    found: BluetoothDevice[];
  }

  export interface PrintTextOptions {
    encoding?: string;
    codepage?: number;
    widthtimes?: number;
    heigthtimes?: number;
    fonttype?: number;
  }

  export interface PrintPicOptions {
    width?: number;
    left?: number;
  }

  export class BluetoothEscposPrinter {
    // Constantes del módulo
    static readonly width58: number;
    static readonly width80: number;

    // Métodos principales
    static printerInit(): Promise<void>;
    static printAndFeed(feed: number): Promise<void>;
    static printerLeftSpace(sp: number): Promise<void>;
    static printerLineSpace(sp: number): Promise<void>;
    static printerUnderLine(line: 0 | 1 | 2): Promise<void>;
    static printerAlign(align: 0 | 1 | 2): Promise<void>;
    static printText(text: string, options?: PrintTextOptions): Promise<void>;
    static printColumn(
      columnWidths: number[],
      columnAligns: number[],
      columnTexts: string[],
      options?: PrintTextOptions,
    ): Promise<void>;
    static setWidth(width: number): void;
    static printPic(base64encodeStr: string, options?: PrintPicOptions): void;
    static selfTest(cb?: (result: boolean) => void): void;
    static rotate(rotate: 0 | 1): Promise<void>;
    static setBlob(weight: number): Promise<void>;
    static printQRCode(
      content: string,
      size: number,
      correctionLevel: number,
    ): Promise<void>;
    static printBarCode(
      str: string,
      nType: number,
      nWidthX: number,
      nHeight: number,
      nHriFontType: number,
      nHriFontPosition: number,
    ): void;
    static openDrawer(nMode: number, nTime1: number, nTime2: number): void;
    static cutOnePoint(): void;
  }

  export class BluetoothManager {
    // Constantes del módulo
    static readonly EVENT_DEVICE_ALREADY_PAIRED: string;
    static readonly EVENT_DEVICE_FOUND: string;
    static readonly EVENT_DEVICE_DISCOVER_DONE: string;
    static readonly EVENT_CONNECTION_LOST: string;
    static readonly EVENT_UNABLE_CONNECT: string;
    static readonly EVENT_CONNECTED: string;
    static readonly EVENT_BLUETOOTH_NOT_SUPPORT: string;
    static readonly DEVICE_NAME: string;

    // Métodos principales
    static enableBluetooth(): Promise<BluetoothDevice[]>;
    static disableBluetooth(): Promise<boolean>;
    static isBluetoothEnabled(): Promise<boolean>;
    static scanDevices(): Promise<ScanResult>;
    static connect(address: string): Promise<string>;
    static disconnect(address: string): Promise<string>;
    static unpaire(address: string): Promise<string>;
    static isDeviceConnected(): Promise<boolean>;
    static getConnectedDeviceAddress(): Promise<string | null>;

    // Eventos
    static addListener(
      event: string,
      listener: (data: any) => void,
    ): EmitterSubscription;

    static removeAllListeners(event: string): void;
  }
}
