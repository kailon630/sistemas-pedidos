export interface ProductRegistrationRequest {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string;
  ProductName: string;
  ProductDescription: string;
  ProductUnit: string;
  Justification: string;
  RequesterID: number;
  Requester: {
    ID: number;
    Name: string;
    Email: string;
    Role: string;
    SectorID: number;
    Sector: {
      ID: number;
      Name: string;
    };
  };
  SectorID: number;
  Sector: {
    ID: number;
    Name: string;
  };
  Status: 'pending' | 'approved' | 'rejected';
  AdminNotes?: string;
  ProcessedBy?: number;
  ProcessedAt?: string;
  Processor?: {
    ID: number;
    Name: string;
    Email: string;
  };
  CreatedProductID?: number;
  CreatedProduct?: {
    ID: number;
    Name: string;
    Description: string;
    Unit: string;
    Status: string;
  };
}

export interface CreateProductRegistrationData {
  productName: string;
  productDescription?: string;
  productUnit: string;
  justification: string;
}

export interface ProcessProductRegistrationData {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

export interface ProductRegistrationStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}