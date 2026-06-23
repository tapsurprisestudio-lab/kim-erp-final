declare module "nodemailer" {
  type Attachment = {
    filename?: string;
    content?: Buffer | string;
    contentType?: string;
  };

  type TransportOptions = {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };

  type SendMailOptions = {
    from: string;
    to: string;
    subject: string;
    text?: string;
    attachments?: Attachment[];
  };

  type Transporter = {
    sendMail(options: SendMailOptions): Promise<unknown>;
  };

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export default nodemailer;
}
