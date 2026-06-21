export interface RoomService {
  id: string;
  roomId: string;
  serviceId: string;
  unitPrice: number;
  service: {
    id: string;
    name: string;
    type: 'metered' | 'fixed';
    unit: string | null;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomServicePayload {
  serviceId: string;
  unitPrice: number;
}

export interface UpdateRoomServicePayload {
  unitPrice: number;
}
