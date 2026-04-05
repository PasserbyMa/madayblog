import mongoose, { Schema, model, Document } from 'mongoose';

export interface IRaspberryStatus {
    backup: {
        lastTime: string;   // ISO 날짜
        size: string;       // "142MB"
        count: number;      // 보관 중인 백업 수
    };
    disk: {
        total: string;      // "29G"
        used: string;       // "8.2G"
        avail: string;      // "20.8G"
        percent: number;    // 28
    };
    system: {
        cpu: number;        // 23.4
        memUsed: number;    // MB
        memTotal: number;   // MB
        temp: string;       // "52.3'C"
    };
    updatedAt: Date;
}

export interface IRaspberryDocument extends IRaspberryStatus, Document {}

const raspberrySchema = new Schema<IRaspberryDocument>(
    {
        backup: {
            lastTime: { type: String, required: true },
            size:     { type: String, required: true },
            count:    { type: Number, required: true },
        },
        disk: {
            total:   { type: String,  required: true },
            used:    { type: String,  required: true },
            avail:   { type: String,  required: true },
            percent: { type: Number,  required: true },
        },
        system: {
            cpu:      { type: Number, required: true },
            memUsed:  { type: Number, required: true },
            memTotal: { type: Number, required: true },
            temp:     { type: String, required: true },
        },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

const ModelRaspberry =
    mongoose.models.raspberry || model<IRaspberryDocument>('raspberry', raspberrySchema);

export default ModelRaspberry;
