const FORMULA_A = Number(process.env.NEXT_PUBLIC_FORMULA_A);
const FORMULA_B = Number(process.env.NEXT_PUBLIC_FORMULA_B);

class Decoder {
    // Decodes a byte using VTLB decoding logic
    decodeByteVtlb(byte: number): string {
        return String.fromCharCode((byte - FORMULA_A) % Number(FORMULA_B));
    }

    // Decodes the entire content using the VTLB method from a Uint8Array
    decodeVtlb(fileContent: Uint8Array): string {
        let decodedContent = "";
        for (const byte of fileContent) {
            decodedContent += this.decodeByteVtlb(byte);
        }
        return decodedContent;
    }

    // Decodes a byte using PNGB decoding logic
    decodeBytePngb(byte: number): number {
        return (byte - Number(FORMULA_A)) % Number(FORMULA_B);
    }

    // Decodes the input PNG content (which is passed as a string or buffer)
    decodePngbContent(content: string | Uint8Array): Uint8Array {
        return new Uint8Array([...content].map(b => this.decodeBytePngb(typeof b === 'string' ? b.charCodeAt(0) : b)));
    }
}

export default Decoder;