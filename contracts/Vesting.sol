// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract Vesting {

    uint256 public lastIndex;
    address immutable nodesys;
    bool private unlock;

    struct User{
        uint256 amountLock;
        bool unlock;
        bool added;
        bool assigned;
        bool exclusion;
    }

    mapping(uint256 => address) private indexToAddress;
    mapping(address => User) public userData;
    

    event UnlockAddress(
        address indexed sender
    );
    event UnlockAllUsers(
        uint timestamp
    );
    event Exception(
        address indexed user
    );
    event UserVesting(
        uint256 totalLocked,
        address indexed user,
        uint blockNumber
    );



    constructor(address _nodesys){
        nodesys = _nodesys;
    }

    modifier Nodesys(){
        require(nodesys == msg.sender,"Only Nodesys smart-contract");
        _;
    }
    

    function addAddress(address sender ,address _newAddress, uint amount) external Nodesys{ 
        User storage user = userData[_newAddress];
        if (sender != address(0)){
            User storage userSender = userData[sender];
            userSender.amountLock -= amount;
        }
        
        if(!user.added) {
            lastIndex++;
            uint _lastIndex = lastIndex;

            indexToAddress[_lastIndex] = _newAddress;
            user.added = true;
            user.amountLock = amount;

            emit UserVesting(_lastIndex, _newAddress, block.number);
        }else{
            user.amountLock += amount;
        }
        
    }

    function getRandom() internal view returns(uint256) {
       uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao,block.timestamp,block.gaslimit,block.basefee)));
       return random;
    }

    function addException(address _user) external Nodesys {
        User storage user = userData[_user];
        require(!unlock && !user.unlock,"User unlocked");
        require(user.added && !user.exclusion,"The user has not been added or is on the exclusion list");
        user.exclusion = true;
        emit Exception(_user);
    }

    function unlockAll() external Nodesys {
        unlock = true;
        emit UnlockAllUsers(block.timestamp);
    }

    function assignRandomAddresses(uint8 percentage) external Nodesys{
        require(percentage <= 100, "Percentage must be <= 100");
        uint256 numAddressesToSetTrue = (lastIndex * percentage) / 100;
        require(numAddressesToSetTrue > 0, "Percentage is too low");
        
        uint256 seed = getRandom();
        uint256 currentIndex = lastIndex;
        
        while (numAddressesToSetTrue > 0 ) {
            address candidate = indexToAddress[currentIndex];
            User storage user = userData[candidate];
            if (!user.assigned && seed % currentIndex < numAddressesToSetTrue) {
                
                user.unlock = true;
                user.assigned = true;
                user.amountLock = 0;

                numAddressesToSetTrue--;
                emit UnlockAddress(candidate);
            }
            currentIndex--;
            seed = uint256(keccak256(abi.encodePacked(seed))); // Update the seed
        }
    }
    function checkUnlock(address user) public view returns(bool){
        return unlock ? true: userData[user].amountLock == 0 ;
    }

}