import AwaitBlock from "../models/handlers/AwaitBlock.js";
import Comment from "../models/handlers/Comment.js";
import DebugTag from "../models/handlers/DebugTag.js";
import EachBlock from "../models/handlers/EachBlock.js";
import Element from "../models/handlers/Element.js";
import Head from "../models/handlers/Head.js";
import HtmlTag from "../models/handlers/HtmlTag.js";
import IfBlock from "../models/handlers/IfBlock.js";
import InlineComponent from "../models/handlers/InlineComponent.js";
import KeyBlock from "../models/handlers/KeyBlock.js";
import Slot from "../models/handlers/Slot.js";
import SlotTemplate from "../models/handlers/SlotTemplate.js";
import Tag from "../models/handlers/Tag.js";
import Text from "../models/handlers/Text.js";
import Title from "../models/handlers/Title.js";

function noop() {}

export const handlers = {
  AwaitBlock,
  Body: noop,
  Comment,
  DebugTag,
  Document: noop,
  EachBlock,
  Element,
  Head,
  IfBlock,
  InlineComponent,
  KeyBlock,
  MustacheTag: Tag,
  Options: noop,
  RawMustacheTag: HtmlTag,
  Slot,
  SlotTemplate,
  Text,
  Title,
  Window: noop,
};
