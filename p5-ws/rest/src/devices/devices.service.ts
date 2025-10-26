import { Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';

const devices: Device[] = [
  { id: '1', name: 'Device A', type: 'Type 1' },
  { id: '2', name: 'Device B', type: 'Type 2' },
];

@Injectable()
export class DevicesService {
  create(createDeviceDto: CreateDeviceDto) {
    devices.push({id:(devices.length+1).toString(), ...createDeviceDto});
    return devices[devices.length - 1];
  }

  findAll() {
    return devices;
  }

  findOne(id: number) {
    return devices.find(device => device.id === id.toString());
  }

  update(id: number, updateDeviceDto: UpdateDeviceDto) {
    const deviceIndex = devices.findIndex(device => device.id === id.toString());
    if (deviceIndex === -1) {
      return null;
    }
    devices[deviceIndex] = { ...devices[deviceIndex], ...updateDeviceDto };
    return devices[deviceIndex];
  }

  remove(id: number) {
    const deviceIndex = devices.findIndex(device => device.id === id.toString());
    if (deviceIndex === -1) {
      return null;
    }
    devices.splice(deviceIndex, 1);
    return { id: id.toString() };
  }
}
