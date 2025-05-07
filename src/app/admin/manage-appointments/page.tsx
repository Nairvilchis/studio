'use client';

import type { AppointmentFormData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Placeholder data - replace with actual data fetching
const appointments: AppointmentFormData[] = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    service: 'Service 1',
    date: new Date('2023-10-27T10:00:00'), // Use Date object
    time: '10:00 AM',
    message: 'Looking forward to the appointment.',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '987-654-3210',
    service: 'Service 2',
    date: new Date('2023-10-28T14:30:00'), // Use Date object
    time: '02:30 PM',
    message: '',
  },
  // Add more placeholder appointments as needed
];

export default function ManageAppointmentsPage() {
  const [filter, setFilter] = useState('');

  const filteredAppointments = appointments.filter((appointment) =>
    Object.values(appointment).some((value) => {
      if (value instanceof Date) {
        // Check both date and time parts for filtering
        return value.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).toLowerCase().includes(filter.toLowerCase()) ||
               value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }).toLowerCase().includes(filter.toLowerCase());
      }
      // Ensure value is not null or undefined before calling toString
      return value?.toString().toLowerCase().includes(filter.toLowerCase());
    }
    )
  );

  const handleApprove = (appointment: AppointmentFormData) => {
    console.log('Approving appointment:', appointment);
    // Implement approval logic here
  };

  const handleReject = (appointment: AppointmentFormData) => {
    console.log('Rejecting appointment:', appointment);
    // Implement rejection logic here
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="filter">Filter Appointments</Label>
            <Input
              id="filter"
              type="text"
              placeholder="Search..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment, index) => (
                <TableRow key={index}>
                  <TableCell>{appointment.name}</TableCell>
                  <TableCell>{appointment.email}</TableCell>
                  <TableCell>{appointment.phone}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>{appointment.date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(appointment)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(appointment)}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
