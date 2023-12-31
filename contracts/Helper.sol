// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Helper{

    
  
    function addr_To_Byte(address a) pure public returns (bytes memory addr){

        addr = abi.encode(a);
    }
    function addrArr_To_Byte(address[] memory a) pure public returns (bytes memory addr){

        addr = abi.encode(a);
    }

    function byte_to_Addr(bytes memory data) pure public returns (address addr){

        addr = abi.decode(data,(address));
    }

    function str_To_Byte(string memory _str) pure public returns (bytes memory _string){

        _string = abi.encode(_str);
    }

    function byte_To_Str(bytes memory data) pure public returns (string memory _string){

        _string = string(abi.encodePacked(data));
    }

    function uintArray_To_Bytes(uint[] memory a) pure public returns (bytes memory _uintarr){

        _uintarr = abi.encode(a);
    }

    function bytes_To_UintArr(bytes memory data) pure public returns (uint256[] memory _uintarr){

        _uintarr =  abi.decode(data, (uint256[]));
    }

    function AddrArray_UintArray_To_Bytes(address[] memory a,uint[] memory b) pure public returns (bytes memory arrays){

        arrays = abi.encode(a,b);
    }

    function bytes_to_AddrArray_UintArray(bytes memory data) pure public returns (address[] memory a,uint256[] memory b){

        (a,b) = abi.decode(data, (address[],uint256[]));
    }

    function uint_To_Bytes(uint a) pure public returns (bytes memory _uint){

        _uint = abi.encode(a);
    }

    function bytes_To_Uint(bytes memory data) pure public returns (uint256 _uint){

        _uint = abi.decode(data,(uint256));
    }

    function addr_Uint_To_Bytes(address a,uint b) pure public returns (bytes memory arrays){

        arrays = abi.encode(a,b);
    }

    function bytes_to_Addr_Unt(bytes memory data) pure public returns (address a,uint b){

        (a,b) = abi.decode(data,(address,uint256));
    }


    function uints_To_Bytes(uint a,uint b, uint8 c) pure public returns (bytes memory _uint){

        _uint = abi.encode(a,b,c);
    }

    function bytes_To_Uints(bytes memory data) pure public returns (uint256 a,uint256 b,uint8 c){

        (a,b,c) = abi.decode(data,(uint256,uint256,uint8));
    }
}
