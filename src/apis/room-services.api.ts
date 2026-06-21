import axiosInstance from '@/lib/axios';
import { RoomService, CreateRoomServicePayload, UpdateRoomServicePayload } from '@/types/room-service.types';

const roomServicesApi = {
  getAll: (roomId: string): Promise<RoomService[]> =>
    axiosInstance.get(`/landlord/rooms/${roomId}/services`).then((r) => r.data),

  create: (roomId: string, data: CreateRoomServicePayload): Promise<RoomService> =>
    axiosInstance.post(`/landlord/rooms/${roomId}/services`, data).then((r) => r.data),

  update: (roomId: string, id: string, data: UpdateRoomServicePayload): Promise<RoomService> =>
    axiosInstance.patch(`/landlord/rooms/${roomId}/services/${id}`, data).then((r) => r.data),

  remove: (roomId: string, id: string): Promise<void> =>
    axiosInstance.delete(`/landlord/rooms/${roomId}/services/${id}`).then((r) => r.data),
};

export default roomServicesApi;
