// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./Consensus.sol";
import "./Vesting.sol";

contract Nodesys is ERC20, Consensus {
                                           
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private vestings;

    mapping(address => mapping(address => uint)) private amountLockUser;
    mapping(address => EnumerableSet.AddressSet) internal vestingUsers;

    error needToken(uint256 vestingAmount, uint256 amountGeneral);

    event addVesting(address indexed user, address indexed vesting, uint256 amountLock);
    event except(address indexed from,address indexed to, address vetingFrom, address vestingTo, uint256 amountLockedFrom, uint256 amountLockedTo);

    constructor(address[] memory _owners) ERC20("node.sys", "NYS") Consensus(_owners){
        _mint(msg.sender,15000000000000000000000000);
        
    }

    function addAddressToVesting(address[] memory users, uint256[] memory amounts) external onlyConsensus{
        uint256 usersLen = users.length;
        require(usersLen == amounts.length,"The array sizes must be the same");
        Vesting vesting = new Vesting(address(this));
        address vestingAddr = address(vesting);
        
        for(uint i; i < usersLen; i++){

            address user = users[i];
            uint amount = amounts[i];

            vesting.addAddress(address(0), user, amount);
            vestingUsers[user].add(vestingAddr);

            emit addVesting(user, vestingAddr, amount);
        }
        vestings.add(vestingAddr);
    }

    function unlockUsers(address vestingAddr,uint8 percentage) external onlyOwner{
        require(checVestingAddr(vestingAddr),"Such a vesting address does not exist");
        Vesting(vestingAddr).assignRandomAddresses(percentage);
    }

    function unlockAllUsers(address vestingAddr) external onlyOwner{
        require(checVestingAddr(vestingAddr),"Such a vesting address does not exist");
        Vesting(vestingAddr).unlockAll();
    }

    function mint(address to, uint256 amount) external onlyConsensus {
        _mint(to, amount);
    }

    function addException(address _vestingAddr, address _user) external onlyOwner{
        require(_vestingAddr != address(0),"Vesting cannot be a zero address");
        require(_user != address(0),"User cannot be a zero address");
        
        Vesting vesting = Vesting(_vestingAddr);
        
        require(checVestingAddr(_vestingAddr),"Such a vesting address does not exist");

        vesting.addException(_user);
    }

   function _checkTransfer(address _from, address _to, uint256 _amount) internal {
        uint length = vestingUsers[_from].length();

        if(length > 0){
            uint256 totalSumLock;
            //Checking all available vestings
            for(uint i = 0; i < length; i++){
                address vesting = vestingUsers[_from].at(i);
                
                Vesting vest = Vesting(vesting);
                (uint amountLock, bool unlock, bool exclusion) =_allVesting(_from, vesting);
                //If this vesting is unlocked, then we skip the iteration
                if(unlock){
                    // vesting is deleted from the user
                    vestingUsers[_from].remove(vesting);
                    continue;
                //In cases where the from address is an exception and it has enough funds to send blocked funds
                }else if(exclusion && amountLock >= _amount){
                    vest.addAddress(_from, _to, _amount);
                    //Checking whether the user has a given vesting address
                    if(!vestingUsers[_to].contains(vesting)){
                        vestingUsers[_to].add(vesting);
                    }
                    super._transfer(_from, _to, _amount);
                    return;
                }
                totalSumLock += amountLock;
            }
            //Checking available funds independent of vesting
            uint256 _amountGeneral = balanceOf(_from) - _amount;
            if(_amountGeneral < totalSumLock){
                revert needToken({
                    vestingAmount: totalSumLock,
                    amountGeneral: _amountGeneral
                });
            }
        }
        super._transfer(_from, _to, _amount);
    }

    function _transfer(address from, address to, uint256 amount) internal override{
        _checkTransfer(from, to, amount);
        
    }

    function seeAddressesVesting() public view returns(address[] memory ){
        uint256 length = vestings.length();
        address[] memory addressesArray = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            addressesArray[i] = vestings.at(i);
        }

        return addressesArray;
    }

    function seeAddressesVestingUser(address _user) public view returns(address[] memory ){
        uint256 length = vestingUsers[_user].length();
        address[] memory addressesArray = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            addressesArray[i] = vestingUsers[_user].at(i);
        }

        return addressesArray;
    }


    function _allVesting(address user, address _vest) internal view returns(uint amountLock, bool unlock, bool exclusion){
        (amountLock, , , ,exclusion) = Vesting(_vest).userData(user);
        unlock = Vesting(_vest).checkUnlock(user);
    }

    function seeCountUsersBlock(address _vestingAddress) external view returns (uint256){
        return Vesting(_vestingAddress).lastIndex();
    }

    function checVestingAddr(address vesting_address) public view returns (bool){
        return vestings.contains(vesting_address);
    } 
}