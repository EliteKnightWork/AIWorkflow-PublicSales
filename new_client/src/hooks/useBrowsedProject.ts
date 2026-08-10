import { browseProject } from '@/api/generated/endpoints/projects';

export const useBrowsedProject = () => {
  const handleBrowseProject = (uuid: string) => {
    browseProject(uuid).catch((e) => {
      console.log(e);
    });
  };

  return { handleBrowseProject };
};
