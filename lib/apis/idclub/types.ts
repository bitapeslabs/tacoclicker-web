type IDClubHoldersResponse = {
  code: number;
  msg: string;
  data: {
    page: number;
    size: number;
    total: number;
    pages: number;
    records: {
      address: string;
      balance: string;
      cnt: number | null;
    }[];
  };
};
