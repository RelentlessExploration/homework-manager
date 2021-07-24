import React, { useEffect, useMemo, useState } from "react";

import AvatarData from "../../avatarData.json";
import { Button, Modal } from "react-bootstrap";
import { CloseButton } from "./CloseButton";
import { AvatarKeyType } from "./ReadOnlyProfile";
import {
  MeDocument,
  MeQuery,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
} from "../generated/graphql";

interface InformationProps {
  avatarId: AvatarKeyType;
  username: string;
  email: string;
  bio: string;
  age: number;
  avatarIdSetter: React.Dispatch<React.SetStateAction<number>>;
}

export const Information: React.FC<InformationProps> = ({
  avatarId,
  avatarIdSetter,
  username,
  email,
  bio,
  age,
}) => {
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const [updateAvatar] = useUpdateAvatarMutation();
  const [show, setShow] = useState<boolean>(false);
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false);
  /* for the avatar modification modal */
  const [avatars, setAvatars] = useState<Array<string>>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);

  /* profile update */
  const [bioValue, setBioValue] = useState<string>(bio);
  const [currAge, setCurrAge] = useState<number>(age);
  const [updateProfile] = useUpdateProfileMutation();

  const handleClose = (action?: string) => {
    if (action === "save" && selectedAvatarId !== null) {
      // mutate the database
      updateAvatar({
        variables: {
          newId: selectedAvatarId,
        },
      });
      // and set the state
      avatarIdSetter(selectedAvatarId);
    }
    setShow(false);
  };
  const handleShow = () => setShow(true);

  const saveEdit = async () => {
    await updateProfile({
      variables: {
        bio: bioValue,
        age: currAge,
      },
      update: (store, { data }) => {
        if (!data) return null;
        store.writeQuery<MeQuery>({
          query: MeDocument,
          data: {
            __typename: "Query",
            me: data.updateProfile,
          },
        });
        return null;
      },
    });
    setShowSaveButton(false);
  };

  const getSrcById = async (
    id: AvatarKeyType,
    setter: (arg: string) => any
  ) => {
    const { default: res } = await import(
      `../../public/images/avatars/${AvatarData[id]}.svg` // use different avatars based on the avatarId
      // binded to the user and stored in the database
    );
    setter(res.src as string);
  };

  const ages = useMemo(() => {
    let res = [];
    for (let i = 1; i <= 150; ++i) {
      res.push(i);
    }
    return res.map((each) => {
      return (
        <option key={each} value={each}>
          {each}
        </option>
      );
    });
  }, []);

  /* this part gets the right avatar based on activeAvatar */
  useEffect(() => {
    getSrcById(avatarId, setAvatarSrc);
  }, [avatarId]);

  /* set up an event listener of cmd+s */
  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (
        (window.navigator.userAgent.indexOf("Mac") !== -1
          ? e.metaKey
          : e.ctrlKey) &&
        e.key === "s"
      ) {
        e.preventDefault();
        if (showSaveButton) {
          saveEdit();
        }
      }
    });
  });

  /* dynamically importing all avatars to display on the modal */
  useEffect(() => {
    const getAllAvatars = async () => {
      setAvatars([]);
      for (
        let i: AvatarKeyType = "0";
        parseInt(i) < Object.keys(AvatarData).length;
        i = `${parseInt(i) + 1}` as any
      ) {
        try {
          const { default: res } = await import(
            `../../public/images/avatars/${AvatarData[i]}.svg`
          );
          setAvatars((prev) => {
            return [...prev, res.src as string];
          });
        } catch (err) {
          console.log(err);
        }
      }
    };

    getAllAvatars();
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", () => {
      if (showSaveButton) {
        alert("You have unsaved changes, are you sure to leave the page?");
      }
    });
  });

  return (
    <>
      <div className="profile-top-section">
        <img onClick={handleShow} alt="" className="avatar" src={avatarSrc} />
        <div className="profile-top-section__headings">
          <h2>{username}</h2>

          <h5>{email}</h5>

          <h6>
            <select
              onChange={(e) => {
                const newAge = parseInt(e.target.value);
                setCurrAge(newAge);

                setShowSaveButton(newAge !== age);
              }}
              className="select"
              defaultValue={age}
            >
              {ages}
            </select>
            &nbsp; year{age > 1 ? "s" : ""} old{" "}
          </h6>
        </div>
      </div>

      <div className="profile-bio-container">
        <textarea
          className="profile-bio"
          value={bioValue}
          onChange={(e) => {
            const newBio = e.target.value;
            setBioValue(newBio);
            setShowSaveButton(newBio !== bio);
          }}
        ></textarea>
      </div>

      {showSaveButton && (
        <button
          style={{
            float: "right",
            marginTop: "20px",
            marginBottom: "10px",
            marginRight: "10%",
            transform: "scale(1.1)",
          }}
          className="rounded-btn"
          onClick={async () => {
            await saveEdit();
          }}
        >
          Save
        </button>
      )}

      <Modal
        className="bootstrap-modal margin-top-nav"
        show={show}
        onHide={() => handleClose("close")}
      >
        <Modal.Header>
          <Modal.Title>Change your avatar</Modal.Title>
          <CloseButton
            handleClick={() => {
              setShow(false);
            }}
          />
        </Modal.Header>

        <Modal.Body>
          {avatars.map((each, ind) => {
            return (
              <img
                src={each}
                key={each}
                alt=""
                className={`avatar-option${
                  ind ===
                  (selectedAvatarId !== null
                    ? selectedAvatarId
                    : parseInt(avatarId))
                    ? " avatar-option-active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedAvatarId(ind);
                }}
              />
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={() => handleClose("save")}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};