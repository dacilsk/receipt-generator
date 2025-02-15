export class StringUtils {
  public static isEmpty(str: string | null | undefined): boolean {
    return str === undefined || str === null || str.trim().length < 1;
  }

  public static isNotEmpty(str: string | null | undefined): boolean {
    return str !== undefined && str !== null && str.trim().length > 0;
  }
}
