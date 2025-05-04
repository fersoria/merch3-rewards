// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

// Eliminamos las importaciones de OpenZeppelin ERC721 ya que este contrato no será un NFT
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// Cambiamos el nombre del contrato de nuevo a MerchAttestation
contract MerchAttestation { // Nombre del contrato actualizado
    // Eliminamos las variables y mappings relacionados con NFTs que no necesitamos
    // uint256 public tokenIdCounter;
    // mapping(uint256 tokenId => string) public tokenURIs;
    // string[] public uris = [...];

    // Mapping para rastrear si un código único ha sido reclamado y por quién
    mapping(string uniqueCode => address claimant) public claimedCodes;
    
    // Mapping para almacenar la URL de la imagen de la merch reclamada
    mapping(string uniqueCode => string imageUrl) public claimedImages;

    // Mapping para almacenar las URLs de las imágenes predefinidas
    mapping(string uniqueCode => string) public predefinedImages;

    // Evento para registrar cada reclamo exitoso en la blockchain
    // Esto facilita el seguimiento y la verificación de los reclamos
    event MerchCodeClaimed(string indexed uniqueCode, address indexed claimant, string imageUrl, uint256 timestamp);

    // Constructor simple. No necesita inicializar contratos padres ERC721.
    constructor() {
        // Configurar las imágenes predefinidas para los códigos CAMP001 a CAMP100
        // Usando el enlace directo de Google Drive
        string memory imageUrl = "https://drive.usercontent.google.com/download?id=1cdb-4B1dTT9KU_9mey4ae4VUFZfk_Ubq&export=view&authuser=0";
        
        // Configurar códigos del 1 al 9 (CAMP001 a CAMP009)
        for(uint i = 1; i < 10; i++) {
            string memory code = string.concat("CAMP00", Strings.toString(i));
            predefinedImages[code] = imageUrl;
        }
        
        // Configurar códigos del 10 al 99 (CAMP010 a CAMP099)
        for(uint i = 10; i < 100; i++) {
            string memory code = string.concat("CAMP0", Strings.toString(i));
            predefinedImages[code] = imageUrl;
        }
        
        // Configurar código CAMP100
        predefinedImages["CAMP100"] = imageUrl;
    }

    // Eliminamos las funciones relacionadas con URIs de NFTs
    // function _baseURI() ...
    // function tokenURI() ...

    // Función para que el administrador configure las imágenes predefinidas
    function setPredefinedImage(string calldata uniqueCode, string calldata imageUrl) public {
        // TODO: Agregar restricción de acceso para que solo el administrador pueda llamar esta función
        predefinedImages[uniqueCode] = imageUrl;
    }

    // Función principal para que un usuario reclame un código único de mercancía
    // @param uniqueCode: El código único asociado a la pieza de mercancía
    function claimCode(string calldata uniqueCode) public {
        // Requerir que el código único no haya sido reclamado antes
        require(claimedCodes[uniqueCode] == address(0), "Code already claimed");
        
        // Requerir que exista una imagen predefinida para este código
        require(bytes(predefinedImages[uniqueCode]).length > 0, "No predefined image for this code");

        // Registrar el reclamo: asociar el código único con la dirección del usuario que llama
        claimedCodes[uniqueCode] = msg.sender;
        
        // Almacenar la URL de la imagen predefinida
        claimedImages[uniqueCode] = predefinedImages[uniqueCode];

        // Emitir un evento para registrar el reclamo en los logs de la transacción
        emit MerchCodeClaimed(uniqueCode, msg.sender, predefinedImages[uniqueCode], block.timestamp);
    }

    // Función de vista para verificar si un código específico ha sido reclamado y por quién
    // @param uniqueCode: El código único a verificar
    // @return La dirección de la billetera que reclamó el código, o address(0) si no ha sido reclamado
    function getClaimant(string calldata uniqueCode) public view returns (address) {
        return claimedCodes[uniqueCode];
    }

    // Función de vista para obtener la URL de la imagen de un código reclamado
    function getClaimedImage(string calldata uniqueCode) public view returns (string memory) {
        return claimedImages[uniqueCode];
    }

    // Función de vista para obtener la URL de la imagen predefinida de un código
    function getPredefinedImage(string calldata uniqueCode) public view returns (string memory) {
        return predefinedImages[uniqueCode];
    }

    // Opcional: Función de vista para verificar si una dirección específica ha reclamado algún código
    // @param claimantAddress: La dirección a verificar
    // @return true si la dirección ha reclamado al menos un código, false en caso contrario
    // function hasClaimed(address claimantAddress) public view returns (bool) {
    //     return hasClaimedAnyCode[claimantAddress];
    // }
}
