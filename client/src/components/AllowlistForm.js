import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "./AllowlistForm.css";
import { addDocument, findUUID } from "../api/fauna";
import MapPage from "./MapPage";

export default function AllowlistForm(props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [formFail, setFormFail] = useState(false);
  const [land, setLand] = useState([]);

  const landHandler = (newLand) => {
    setLand(newLand);
  };

  useEffect(() => {
    register("firstName", { required: true });
    register("lastName", { required: true });
    register("walletAddress", { required: true });
  }, [register]);

  async function submitForm(data) {
    // generate uuid
    let uuid = "";
    // check for duplicate uuids in db
    while (true) {
      const generatedUUID = crypto.randomUUID();
      const didFindUUID = await findUUID(generatedUUID);
      if (!didFindUUID) {
        uuid = generatedUUID;
        break;
      }
    }
    // add stuff to Fauna
    await addDocument(
      uuid,
      data.firstName,
      data.lastName,
      land,
      data.walletAddress
    )
      .then((res) => {
        if (!res.ok && res.status >= 400) {
          setFormFail(true);
          return;
        } else {
          // add stuff to contract
          props.contract.methods
            ._createAllowlister(uuid)
            .send({ from: props.accounts[0] })
            .then(() => {
              setFirstName("");
              setLastName("");
              setWalletAddress("");
              setFormSuccess(true);
            })
            .catch(() => {
              setFirstName("");
              setLastName("");
              setWalletAddress("");
              setFormFail(true);
              return;
            });
        }
      })
      .catch(() => {
        setFirstName("");
        setLastName("");
        setWalletAddress("");
        setFormFail(true);
        return;
      });
  }

  const submitLand = () => {
    if (land.length === 0) {
      alert("No Land selected");
      return;
    }

    console.log(land);
    alert("Congrats! Now this land belongs to you now");
  };

  return (
    <div className="wrapper">
      <div className="titleDiv">Terrafirmask</div>
      {formFail && (
        <div className="successMessage">
          <p>
            Successfully submitted land entry for {firstName + " " + lastName}{" "}
            with wallet address {walletAddress}!
          </p>
        </div>
      )}
      {formSuccess && (
        <div className="successMessage">
          <p>
            Successfully submitted land entry for {firstName + " " + lastName}{" "}
            with wallet address {walletAddress}!
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit((data) => submitForm(data))}>
        <div className="header">
          <h1>Claim a Land</h1>
        </div>
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          onChange={(e) => setValue("firstName", e.target.value)}
        />
        {errors.firstName && (
          <span role="alert" className="errorField">
            First name is required.
          </span>
        )}
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          onChange={(e) => setValue("lastName", e.target.value)}
        />
        {errors.lastName && (
          <span role="alert" className="errorField">
            Last name is required.
          </span>
        )}
        <label htmlFor="walletAddress">Wallet Address</label>
        <input
          id="walletAddress"
          onChange={(e) => setValue("walletAddress", e.target.value)}
        />
        {errors.walletAddress && (
          <span role="alert" className="errorField">
            Wallet address is required.
          </span>
        )}
        <input type="submit" className="claimButton" />
      </form>
      <MapPage landHandler={landHandler} />
    </div>
  );
}
