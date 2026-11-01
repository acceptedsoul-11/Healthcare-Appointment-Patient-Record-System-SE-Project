
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Please sign in to view appointments." },
        { status: 401 }
      );
    }

    await connectDB();

    let filter: Record<string, unknown> = {};

    if (currentUser.role === "patient") {
      const patient = await Patient.findOne({
        userId: currentUser.id,
      }).select("_id");

      if (!patient) {
        return NextResponse.json({ appointments: [] });
      }

      filter = { patientId: patient._id };
    } else if (currentUser.role === "doctor") {
      const doctor = await Doctor.findOne({
        userId: currentUser.id,
      }).select("_id");

      if (!doctor) {
        return NextResponse.json({ appointments: [] });
      }

      filter = { doctorId: doctor._id };
    } else if (
      currentUser.role !== "receptionist" &&
      currentUser.role !== "administrator"
    ) {
      return NextResponse.json(
        { message: "You are not authorized to view appointments." },
        { status: 403 }
      );
    }

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: 1, startTime: 1 })
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "fullName email",
        },
      })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "fullName email",
        },
      })
      .lean();

    const result = appointments.map((appointment) => {
      const patient = appointment.patientId as unknown as {
        _id: { toString(): string };
        userId?: { fullName?: string; email?: string } | null;
      } | null;

      const doctor = appointment.doctorId as unknown as {
        _id: { toString(): string };
        specialization?: string;
        consultationFee?: number;
        userId?: { fullName?: string; email?: string } | null;
      } | null;

      return {
        id: appointment._id.toString(),
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        reason: appointment.reason,
        status: appointment.status,
        notes: appointment.notes || "",
        patient: patient
          ? {
              id: patient._id.toString(),
              name: patient.userId?.fullName || "Patient",
              email: patient.userId?.email || "",
            }
          : null,
        doctor: doctor
          ? {
              id: doctor._id.toString(),
              name: doctor.userId?.fullName || "Doctor",
              email: doctor.userId?.email || "",
              specialization: doctor.specialization || "",
              consultationFee: doctor.consultationFee ?? 0,
            }
          : null,
      };
    });

    return NextResponse.json({ appointments: result });
  } catch (error) {
    console.error("GET /api/appointments failed:", error);

    return NextResponse.json(
      { message: "Unable to retrieve appointments." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Please sign in before booking." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "patient") {
      return NextResponse.json(
        { message: "Only patient accounts can book appointments." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid booking details." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const doctorId =
      typeof data.doctorId === "string" ? data.doctorId.trim() : "";
    const appointmentDate =
      typeof data.appointmentDate === "string"
        ? data.appointmentDate.trim()
        : "";
    const startTime =
      typeof data.startTime === "string" ? data.startTime.trim() : "";
    const reason = typeof data.reason === "string" ? data.reason.trim() : "";

    if (!doctorId || !appointmentDate || !startTime || !reason) {
      return NextResponse.json(
        { message: "Doctor, date, time and reason are required." },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { message: "The reason must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    if (!/^[a-f\d]{24}$/i.test(doctorId)) {
      return NextResponse.json(
        { message: "Invalid doctor selection." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      return NextResponse.json(
        { message: "Invalid appointment date." },
        { status: 400 }
      );
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      return NextResponse.json(
        { message: "Invalid appointment time." },
        { status: 400 }
      );
    }

    const date = new Date(`${appointmentDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== appointmentDate
    ) {
      return NextResponse.json(
        { message: "Invalid appointment date." },
        { status: 400 }
      );
    }

    // Appointment times use the hospital's local clock.
    // This implementation assumes the hospital is in India (IST).
    const [year, month, day] = appointmentDate.split("-").map(Number);
    const [hour, minute] = startTime.split(":").map(Number);
    const requestedDateTime = new Date(
      Date.UTC(year, month - 1, day, hour - 5, minute - 30)
    );

    if (requestedDateTime <= new Date()) {
      return NextResponse.json(
        { message: "Please select a future appointment date and time." },
        { status: 400 }
      );
    }

    await connectDB();

    const patient = await Patient.findOne({
      userId: currentUser.id,
    });

    if (!patient) {
      return NextResponse.json(
        {
          message:
            "Your patient profile is missing. Please contact reception.",
        },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return NextResponse.json(
        { message: "The selected doctor was not found." },
        { status: 404 }
      );
    }

    const doctorUser = await import("@/models/User").then(({ default: User }) =>
      User.findById(doctor.userId).select("isActive accountStatus")
    );

    if (
      !doctorUser ||
      !doctorUser.isActive ||
      (doctorUser.accountStatus && doctorUser.accountStatus !== "approved")
    ) {
      return NextResponse.json(
        { message: "The selected doctor is not currently available for bookings." },
        { status: 400 }
      );
    }

    const dayOfWeek = date.getUTCDay();
    const availability = doctor.availability.find(
      (slot) => slot.dayOfWeek === dayOfWeek
    );

    if (!availability) {
      return NextResponse.json(
        { message: "This doctor is not available on the selected day." },
        { status: 400 }
      );
    }

    const slotDuration = 30;
    const requestedStart = hour * 60 + minute;
    const requestedEnd = requestedStart + slotDuration;

    const availabilityStart =
      Number(availability.startTime.slice(0, 2)) * 60 +
      Number(availability.startTime.slice(3, 5));

    const availabilityEnd =
      Number(availability.endTime.slice(0, 2)) * 60 +
      Number(availability.endTime.slice(3, 5));

    if (
      requestedStart < availabilityStart ||
      requestedEnd > availabilityEnd ||
      requestedStart % slotDuration !== 0
    ) {
      return NextResponse.json(
        {
          message:
            "The selected time is outside the doctor's available hours.",
        },
        { status: 400 }
      );
    }

    const existingAppointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate: date,
      status: { $in: ["scheduled", "confirmed"] },
    }).select("startTime endTime");

    const overlaps = existingAppointments.some((appointment) => {
      const existingStart =
        Number(appointment.startTime.slice(0, 2)) * 60 +
        Number(appointment.startTime.slice(3, 5));

      const existingEnd =
        Number(appointment.endTime.slice(0, 2)) * 60 +
        Number(appointment.endTime.slice(3, 5));

      return requestedStart < existingEnd && requestedEnd > existingStart;
    });

    if (overlaps) {
      return NextResponse.json(
        {
          message:
            "That time slot has already been booked. Please choose another.",
        },
        { status: 409 }
      );
    }

    const endTime = `${String(Math.floor(requestedEnd / 60)).padStart(2, "0")}:${String(requestedEnd % 60).padStart(2, "0")}`;

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: date,
      startTime,
      endTime,
      reason,
      status: "scheduled",
    });

    return NextResponse.json(
      {
        message: "Appointment booked successfully.",
        appointment: {
          id: appointment._id.toString(),
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          reason: appointment.reason,
          status: appointment.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/appointments failed:", error);

    return NextResponse.json(
      { message: "Unable to book the appointment." },
      { status: 500 }
    );
  }
}
