import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";

interface TranscriptAttributes {
  transcriptId: string;
  orderId: string;
  userId: string;
  paymentId?: string | null;
  data: any; // JSON snapshot of the order at time of generation
  filePath: string; // relative or absolute path to the PDF file on disk
  fileSize?: number | null;
  mimeType?: string | null; // typically application/pdf
}

type TranscriptCreationAttributes = Optional<
  TranscriptAttributes,
  "transcriptId" | "fileSize" | "mimeType" | "paymentId"
>;

class Transcript
  extends Model<TranscriptAttributes, TranscriptCreationAttributes>
  implements TranscriptAttributes
{
  public transcriptId!: string;
  public orderId!: string;
  public userId!: string;
  public paymentId?: string | null;
  public data!: any;
  public filePath!: string;
  public fileSize?: number | null;
  public mimeType?: string | null;
}

Transcript.init(
  {
    transcriptId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "application/pdf",
    },
  },
  {
    sequelize,
    modelName: "Transcript",
    tableName: "transcripts",
  }
);

export default Transcript;
