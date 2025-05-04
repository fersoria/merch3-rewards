"use client"; // Le indica a Next.js que este es un componente de cliente. Necesario para usar hooks de React y wagmi.

// Importaciones necesarias de React, hooks de wagmi y hooks de Scaffold-ETH
import React, { useState, useEffect, useRef } from "react"; // Importa React y el hook useState para manejar estado local
import { useWriteContract, useAccount, useReadContract } from "wagmi"; // Importa hooks de wagmi para interactuar con la billetera y enviar transacciones
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth"; // Importa hook de Scaffold-ETH para obtener información del contrato desplegado
import { Html5QrcodeScanner } from "html5-qrcode";

// Puedes importar otros componentes de Scaffold-ETH o tuyos si los necesitas en esta página
// import { Address } from "~~/components/scaffold-eth"; // Ejemplo: si quieres mostrar la dirección con formato especial
// import { WalletConnectButton } from "~~/components/scaffold-eth"; // Ejemplo: si quieres añadir un botón de conexión de billetera

// Este es el componente principal de tu página.
// Aquí integramos la interfaz y lógica para el reclamo de mercancía del MVP.
const Page = () => {
  // Estado local para guardar el código único que el usuario ingresa en el campo de texto
  const [uniqueCode, setUniqueCode] = useState("");
  // Estado local para controlar si el proceso de reclamo fue exitoso y guardar el hash de la transacción confirmada
  const [claimStatus, setClaimStatus] = useState({ success: false, txHash: "" });
  const [showScanner, setShowScanner] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  // Estado para controlar si la transacción está confirmada
  const [isTransactionConfirmed, setIsTransactionConfirmed] = useState(false);

  // Hook de wagmi para obtener información sobre la billetera conectada
  // 'address' es la dirección de la billetera del usuario
  // 'chainId' es el ID de la cadena a la que está conectada la billetera
  const { address, chainId } = useAccount();

  // Hook de Scaffold-ETH para obtener dinámicamente la dirección y la ABI de tu contrato desplegado
  // Busca la información del contrato con el nombre "MerchAttestation" en la red actual (determinada por chainId)
  const { data: deployedContractData } = useDeployedContractInfo("MerchAttestation");

  // Hook de wagmi para preparar la función de escritura (sin parámetros)
  const {
    writeContractAsync,
    isPending: isWriteLoading,
    isSuccess: isWriteMining,
    data: txHash,
    error: writeError
  } = useWriteContract();

  // Hook para leer la imagen predefinida del código
  const { data: predefinedImage } = useReadContract({
    address: deployedContractData?.address,
    abi: deployedContractData?.abi,
    functionName: "getPredefinedImage",
    args: [uniqueCode],
    query: {
      enabled: uniqueCode.length > 0,
    }
  });

  // Hook para verificar si el código ya fue reclamado
  const { data: claimant } = useReadContract({
    address: deployedContractData?.address,
    abi: deployedContractData?.abi,
    functionName: "getClaimant",
    args: [uniqueCode],
    query: {
      enabled: uniqueCode.length > 0,
    }
  });

  // URL de la imagen de la camiseta CAMP
  const campShirtImage = "/T Shirt Camp 5dm.png";

  useEffect(() => {
    setIsClient(true);

    console.log("Predefined Image:", predefinedImage);
    console.log("Unique Code:", uniqueCode);
    console.log("Write Claim Code:", writeContractAsync);
    console.log("Is Loading:", isWriteLoading);
    console.log("Is Mining:", isWriteMining);

    if (showScanner) {
      const newScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      newScanner.render(onScanSuccess, onScanFailure);
      setScanner(newScanner);
    }

    if (predefinedImage && typeof predefinedImage === 'string') {
      console.log("Setting preview image:", predefinedImage);
      setPreviewImage(predefinedImage);
    } else {
      console.log("No valid image URL found");
      setPreviewImage("");
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [showScanner, predefinedImage, uniqueCode, writeContractAsync, isWriteLoading, isWriteMining]);

  const onScanSuccess = (decodedText: string) => {
    setUniqueCode(decodedText);
    setShowScanner(false);
    if (scanner) {
      scanner.clear();
    }
  };

  const onScanFailure = (error: string) => {
    console.warn(`QR Code scan error: ${error}`);
  };

  const handleImageUpload = async (file: File) => {
    // Aquí deberías implementar la lógica para subir la imagen a tu servicio de almacenamiento preferido
    // Por ejemplo, IPFS, AWS S3, etc.
    // Por ahora, usaremos una URL temporal para demostración
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    return imageUrl;
  };

  // Función asíncrona que se ejecuta cuando el usuario hace clic en el botón "Reclamar Código"
  const handleClaim = async () => {
    if (!deployedContractData?.address || !deployedContractData?.abi) {
      alert("El contrato no está listo. Intenta de nuevo en unos segundos.");
      return;
    }
    try {
      if (claimant && claimant !== "0x0000000000000000000000000000000000000000") {
        alert("Este código ya ha sido reclamado");
        return;
      }
      const hash = await writeContractAsync({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "claimCode",
        args: [uniqueCode],
      });
      setClaimStatus({ success: true, txHash: hash });
    } catch (e: any) {
      alert("Error al reclamar: " + (e.message || e));
    }
  };

  // Efecto para verificar la confirmación de la transacción
  useEffect(() => {
    if (txHash && !isTransactionConfirmed) {
      setIsTransactionConfirmed(true);
    }
  }, [txHash, isTransactionConfirmed]);

  // La estructura de la interfaz de usuario del componente (lo que se renderiza en el navegador)
  return (
    // Contenedor principal con estilos básicos en línea para presentación
    <div style={{ margin: "20px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "600px", marginInline: "auto" }}>
      {!isClient ? (
        <p style={{ textAlign: "center", marginBottom: "20px" }}>Cargando...</p>
      ) : address ? (
        <div style={{ marginBottom: "20px", padding: "10px", border: "1px dashed #ddd", borderRadius: "4px" }}>
          <p><strong>Conectado con billetera:</strong> {address}</p> {/* Muestra la dirección de la billetera */}
          {/* Mostramos el Chain ID obtenido de useAccount */}
          <p><strong>Chain ID conectado:</strong> {chainId}</p> {/* Muestra el Chain ID de la red conectada */}
          {/* Puedes añadir aquí lógica para verificar si el chainId es el esperado (123420001114) */}
          {chainId !== 123420001114 && (
              <p style={{ color: 'orange' }}>¡Advertencia! Estás conectado a la red con Chain ID {chainId}. Asegúrate de estar en la testnet de Camp Network (Chain ID 123420001114).</p>
          )}
        </div>
      ) : (
        // Mensaje si la billetera no está conectada
        <p style={{ textAlign: "center", marginBottom: "20px" }}>Por favor, conecta tu billetera para reclamar.</p>
        // Scaffold-ETH a menudo tiene un componente de conexión de billetera en el Header, asegúrate de que funcione.
      )}

      {/* === Sección de Reclamo (Visible si no hay un reclamo exitoso aún) === */}
      {/* Se muestra si la billetera está conectada Y no se ha completado un reclamo exitoso */}
      {address && !claimStatus.success ? (
        <> {/* Usamos un Fragment <> porque retornamos múltiples elementos */}
          <h2 style={{ textAlign: "center", marginBottom: "15px" }}>Reclamar Mercancía</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Ingresa tu código único"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value)}
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "1rem", flex: 1 }}
              />
              <button
                onClick={() => setShowScanner(!showScanner)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "4px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                {showScanner ? "Cerrar Scanner" : "Escanear QR"}
              </button>
            </div>
            
            {showScanner && (
              <div id="qr-reader" style={{ width: "100%", marginTop: "10px" }}></div>
            )}

            {previewImage && (
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <h3>Imagen de la Merch</h3>
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px" }}
                  onError={(e) => {
                    console.error("Error loading image:", e);
                    const target = e.target as HTMLImageElement;
                    console.error("Failed to load image from:", target.src);
                  }}
                  onLoad={() => {
                    console.log("Image loaded successfully");
                  }}
                />
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={!uniqueCode || isWriteLoading || isWriteMining}
              style={{
                padding: "10px 15px",
                borderRadius: "4px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                opacity: (!uniqueCode || isWriteLoading || isWriteMining) ? 0.5 : 1
              }}
            >
              {isWriteLoading ? "Preparando..." : isWriteMining ? "Enviando Transacción..." : "Reclamar Código"}
            </button>
          </div>
          {/* Opcional: Mostrar estado de la transacción mientras se envía */}
          {(isWriteLoading || isWriteMining) && <p style={{ textAlign: "center", color: "#007bff" }}>Estado: Enviando transacción...</p>}
          {/* Mostrar errores de escritura si ocurren */}
          {writeError && <p style={{ color: 'red', textAlign: "center" }}>Error: {writeError.message}</p>}
          {/* Mostrar hash de la transacción una vez enviada (antes de confirmar) */}
          {txHash && <p style={{ color: 'green', textAlign: "center" }}>Transacción enviada: {txHash}</p>}
        </>
      ) : address && claimStatus.success ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          {isWriteLoading ? (
            <div>
              <h2 style={{ color: "#007bff" }}>Confirmando Transacción...</h2>
              <p>Por favor espera mientras confirmamos tu reclamo en la blockchain.</p>
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <>
              <h2 style={{ color: "green" }}>¡Reclamo Exitoso!</h2>
              {/* Hash debajo del título */}
              {claimStatus.txHash && (
                <p style={{ color: 'green', wordBreak: 'break-all', marginBottom: 16 }}>Hash de la transacción: {claimStatus.txHash}</p>
              )}
              <p>¡Has reclamado tu mercancía y tu attestation on-chain ha sido registrada en Camp Network!</p>
              {/* Imagen de la camiseta CAMP justo antes de los botones de compartir */}
              <div style={{ margin: "32px 0 16px 0", display: "flex", justifyContent: "center" }}>
                <img
                  src={campShirtImage}
                  alt="Camiseta CAMP"
                  style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8, boxShadow: "0 2px 8px #0002" }}
                />
              </div>
              <p style={{ marginTop: "10px" }}>Pronto recibirás un POAP exclusivo en tu billetera.</p>
              {/* Sección de botones para compartir en redes sociales */}
              <div style={{ marginTop: "30px" }}>
                <h3>Comparte la Noticia:</h3>
                <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
                  {/* Botón/Enlace para X (Twitter) */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('¡Acabo de reclamar mi mercancía exclusiva en CAMP Protocol! 🎉 #Web3 #CAMP')}&url=${encodeURIComponent('https://camp.network')}&media=${encodeURIComponent(campShirtImage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                       textDecoration: "none",
                       padding: "10px 15px",
                       backgroundColor: "#1DA1F2",
                       color: "white",
                       borderRadius: "4px",
                       fontSize: "0.9rem",
                       fontWeight: "bold"
                    }}
                  >
                    Compartir en X (Twitter)
                  </a>
                  {/* Botón/Enlace para Farcaster */}
                  <a
                    href={`https://warpcast.com/~/compose?text=${encodeURIComponent('¡Acabo de reclamar mi mercancía exclusiva en CAMP Protocol! 🎉 #Web3 #CAMP')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                       textDecoration: "none",
                       padding: "10px 15px",
                       backgroundColor: "#855DCD",
                       color: "white",
                       borderRadius: "4px",
                       fontSize: "0.9rem",
                       fontWeight: "bold"
                    }}
                  >
                    Compartir en Farcaster
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}


    </div> // Cierre del contenedor principal
  ); // Cierre del return
}; // Cierre de la función del componente Page

// Asegúrate de exportar el componente principal de la página
export default Page;
