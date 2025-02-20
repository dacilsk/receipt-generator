export class StringUtils {
  public static isEmpty(str: string | null | undefined): boolean {
    return str === undefined || str === null || str.trim().length < 1;
  }

  public static isNotEmpty(str: string | null | undefined): boolean {
    return str !== undefined && str !== null && str.trim().length > 0;
  }

  public static removeNonASCII(str: string): string {
    return str.replace(/[^\x00-\x7F]/g, '');
  }

  public static truncateString(str: string, maxLength: number): string {
    if (str.length > maxLength) {
      return str.slice(0, maxLength);
    }
    return str;
  }

  public static validatePositiveNumber(value: string): string {
    return this.isPositiveNumber(value) ? value : '';
  }

  // Allow numbers greater than 0, including decimals
  public static isPositiveNumber(value: string): boolean {
    const regex = /^(?:0|[1-9]\d*)?(?:\.\d*)?$/;
    return regex.test(value);
  }
}
