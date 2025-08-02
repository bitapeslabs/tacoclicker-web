import { BoxedResponse, BoxedSuccess, BoxedError } from "@/lib/boxed";
import { IDCLUB_HOLDERS_BASE_URL } from "@/lib/consts";
enum FetchError {
  UnknownError = "UnknownError",
}
export async function idclub_getholders(
  alkanesId: string,
  page = 1,
  size = 40
): Promise<BoxedResponse<IDClubHoldersResponse, FetchError>> {
  try {
    const res = await fetch(IDCLUB_HOLDERS_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alkanesId, page, size }),
    });

    if (!res.ok) {
      return new BoxedError(
        FetchError.UnknownError,
        `Alkanes holderPage fetch failed [${res.status} ${res.statusText}]`
      );
    }

    const json = (await res.json()) as IDClubHoldersResponse;
    return new BoxedSuccess(json);
  } catch (e) {
    return new BoxedError(
      FetchError.UnknownError,
      `Network / parsing error: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}
