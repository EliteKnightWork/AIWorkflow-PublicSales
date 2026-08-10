import React from "react";
import { useMenu, LayoutProps, ITreeMenu } from "@refinedev/core";

import { Link } from "react-router-dom";

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { menuItems } = useMenu();

  const renderMenuItems = (items: ITreeMenu[]) => {
    // TODO: とりあえず、一旦リンクを表示するだけ
    return (
      <>
        {items.map(({ key, name }) => {
          return (
            <li key={key}>
              <Link to={name}>{name}</Link>
            </li>
          );
        })}
      </>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ width: "10%", height: "100%", float: "left" }}>
        <ul style={{ listStyle: "none" }}>{renderMenuItems(menuItems)}</ul>
      </div>
      <div style={{ marginLeft: "10%", height: "100%" }}>{children}</div>
    </div>
  );
};
